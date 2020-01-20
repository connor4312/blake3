import { BaseHashInput, inputToArray, IBaseHashOptions, defaultHashLength } from '../base/hash-fn';
import { hash as rawHash } from '../../dist/wasm/nodejs/blake3_js';

/**
 * Input used for node-based hashes.
 */
export type HashInput = BaseHashInput | string;

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput, encoding?: BufferEncoding): Uint8Array =>
  inputToArray(typeof input === 'string' ? Buffer.from(input, encoding) : input);

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Buffer | string {
  const result = Buffer.alloc(length);
  rawHash(normalizeInput(input), result);
  return result;
}
