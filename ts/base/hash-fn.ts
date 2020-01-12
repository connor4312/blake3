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
