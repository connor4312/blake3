import * as raw from '../pkg/blake3';
import { TextEncoder } from 'util';

export type HashInput = string | Uint8Array | ArrayBuffer | SharedArrayBuffer | ArrayLike<number>;

const encoder = new TextEncoder();

const inputToArray = (input: HashInput) => {
  if (input instanceof Uint8Array) {
    return input;
  }

  if (typeof input === 'string') {
    return encoder.encode(input);
  }

  return new Uint8Array(input);
};

/**
 * Returns a hash from the input data.
 *
 * Note that it returns {@link Uint8Array}s instead of buffers for browser
 * compatibility. You can convert to a buffer using `Buffer.from(hash.digest())`.
 */
export function hash(data: HashInput): Uint8Array {
  return raw.hash(inputToArray(data));
}

/**
 * A blake3 hash. Quite similar to Node's crypto hashing, but it returns
 * {@link Uint8Array}s instead of buffers for browser compatibility. You
 * can convert to a buffer using `Buffer.from(hash.digest())`.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export interface IHash {
  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: HashInput): IHash;

  /**
   * Returns a digest of the hash.
   */
  digest(): Uint8Array;

  /**
   * Frees data associated with the hash. This *must* be called if
   * {@link IHash#digest} is not called in order to free memory.
   */
  dispose(): void;
}

/**
 * Creates a new {@link IHash} which can be appended to.
 */
export function createHash(): IHash {
  let hash: raw.Blake3Hash | undefined = new raw.Blake3Hash();
  let digest: Uint8Array | undefined;

  return {
    update(this: IHash, data: HashInput): IHash {
      if (!hash) {
        throw new Error('Cannot continue hashing after digest() has been called');
      }

      hash.update(inputToArray(data));
      return this;
    },
    digest(): Uint8Array {
      if (!hash) {
        return digest!;
      }

      digest = hash.digest() as Uint8Array;
      hash.free();
      return digest;
    },
    dispose() {
      if (hash) {
        hash.free();
        hash = undefined;
      }
    },
  };
}
