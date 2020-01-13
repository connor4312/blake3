import { Blake3Hash } from '../../dist/wasm/nodejs/blake3_js';
import { BaseHashInput, inputToArray } from './hash-fn';

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export class BaseHash<T extends Uint8Array> {
  // these are covariant, but typing them better has a runtime overhead
  private hash: Blake3Hash | undefined = new this.rawCtor();
  constructor(private readonly rawCtor: { new (): Blake3Hash }, private readonly digested: T) {}

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
  digest(): T {
    if (!this.hash) {
      return this.digested;
    }

    this.hash.digest(this.digested);
    this.hash.free();
    return this.digested;
  }

  /**
   * Frees data associated with the hash. This *must* be called if
   * {@link IHash#digest} is not called in order to free memory.
   */
  dispose() {
    this.hash?.free();
    this.hash = undefined;
  }
}
