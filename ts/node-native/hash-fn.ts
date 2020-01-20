import native from './native';
import { HashInput } from '../node/hash-fn';
import { IBaseHashOptions, defaultHashLength } from '../base/hash-fn';

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput, encoding?: BufferEncoding): Buffer => {
  if (input instanceof Buffer) {
    return input;
  }

  if (typeof input === 'string') {
    return Buffer.from(input, encoding);
  }

  return Buffer.from(input as Uint8Array);
};

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Buffer | string {
  return native.hash(normalizeInput(input), length);
}
