import * as moduleType from '../pkg/nodejs/blake3';

/**
 * A type that can be hashed.
 */
export type HashInput = Uint8Array | ArrayBuffer | SharedArrayBuffer | ArrayLike<number>;

const inputToArray = (input: HashInput) =>
  input instanceof Uint8Array ? input : new Uint8Array(input);

export interface IBlake3Raw {
  /**
   * Raw WebAssembly blake3 instance.
   */
  instance: typeof moduleType;

  /**
   * Returns a hash from the input data.
   */
  hash(data: HashInput): Uint8Array;

  /**
   * Creates a new {@link Hash} which can be appended to.
   */
  createHash(): Hash;
}

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export class Hash {
  // these are covariant, but typing them better has a runtime overhead
  private hash: moduleType.Blake3Hash | undefined = new this.raw.Blake3Hash();
  private digested: Uint8Array | undefined;

  constructor(private readonly raw: typeof moduleType) {}

  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: HashInput): this {
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

export const createModule = (raw: typeof moduleType): IBlake3Raw => ({
  instance: raw,

  hash(data: HashInput): Uint8Array {
    return raw.hash(inputToArray(data));
  },

  createHash() {
    return new Hash(raw);
  },
});
