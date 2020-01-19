import { BaseHashInput, inputToArray, IBaseHashOptions, defaultHashLength } from './hash-fn';

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export interface IHasher<T> {
  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: BaseHashInput): this;

  /**
   * Returns a digest of the hash.
   */
  digest(options?: IBaseHashOptions): T;

  /**
   * Frees data associated with the hash. This *must* be called if
   * {@link IHash#digest} is not called in order to free memory.
   */
  dispose(): void;
}

/**
 * @hidden
 */
export interface IInternalHash {
  free(): void;
  update(bytes: Uint8Array): void;
  digest(into: Uint8Array): void;
}

/**
 * Base implementation of hashing.
 */
export class BaseHash<T extends Uint8Array> implements IHasher<T> {
  // these are covariant, but typing them better has a runtime overhead
  private hash: IInternalHash | undefined;
  private digested?: T;

  constructor(implementation: IInternalHash, private readonly alloc: (length: number) => T) {
    this.hash = implementation;
  }

  /**
   * @inheritdoc
   */
  update(data: BaseHashInput): this {
    if (!this.hash) {
      throw new Error('Cannot continue hashing after digest() or dispose() has been called');
    }

    this.hash.update(inputToArray(data));
    return this;
  }

  /**
   * @inheritdoc
   */
  digest(options?: IBaseHashOptions): T {
    if (this.digested) {
      return this.digested;
    }

    if (!this.hash) {
      throw new Error('Cannot call digest() after dipose() has been called');
    }

    this.digested = this.alloc(options?.length ?? defaultHashLength);
    this.hash.digest(this.digested);
    this.hash.free();
    return this.digested;
  }

  /**
   * @inheritdoc
   */
  dispose() {
    this.hash?.free();
    this.hash = undefined;
  }
}
