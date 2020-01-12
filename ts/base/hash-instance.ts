import type { Blake3Hash } from '../../pkg/nodejs/blake3';
import { BaseHashInput, inputToArray } from './hash-fn';

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export class BaseHash {
  // these are covariant, but typing them better has a runtime overhead
  private hash: Blake3Hash | undefined = new this.rawCtor();
  private digested: Uint8Array | undefined;

  constructor(private readonly rawCtor: { new(): Blake3Hash }) {}

  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: BaseHashInput): this {
    if (!this.hash) {
      throw new Error('Cannot continue hashing after digest() has been called');
    }

    this.hash.update(inputToArray(data));
    return this;
  }

  /**
   * Returns a digest of the hash.
   */
  digest(): Uint8Array {
    if (!this.hash) {
      return this.digested!;
    }

    this.digested = this.hash.digest() as Uint8Array;
    this.hash.free();
    return this.digested;
  }

  /**
   * Frees data associated with the hash. This *must* be called if
   * {@link IHash#digest} is not called in order to free memory.
   */
  dispose() {
    if (this.hash) {
      this.hash.free();
      this.hash = undefined;
    }
  }
}
