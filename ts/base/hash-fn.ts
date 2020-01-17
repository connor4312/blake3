/**
 * Options passed to hash functions.
 */
export interface IBaseHashOptions {
  /**
   * Length of the desired hash, in bytes. Note that when encoding the output
   * as a string, this is *not* the string length.
   */
  length?: number;
}

/**
 * Default hash length, in bytes, unless otherwise specified.
 */
export const defaultHashLength = 32;

/**
 * A type that can be hashed.
 */
export type BaseHashInput = Uint8Array | ArrayBuffer | SharedArrayBuffer | ArrayLike<number>;

/**
 * Converts the input to an Uint8Array.
 * @hidden
 */
export const inputToArray = (input: BaseHashInput) =>
  input instanceof Uint8Array ? input : new Uint8Array(input);
