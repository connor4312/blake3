import { BaseHashInput, inputToArray } from '../base/hash-fn';
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
export function hash(input: HashInput): Buffer;

/**
 * Returns a blake3 hash of the input, returning the hash encoding with the
 * requested encoding.
 */
export function hash(input: HashInput, encoding: BufferEncoding): string;
export function hash(input: HashInput, encoding?: BufferEncoding): Buffer | string {
  const result = Buffer.alloc(32);
  rawHash(normalizeInput(input), result);
  return encoding ? result.toString(encoding) : result;
}
