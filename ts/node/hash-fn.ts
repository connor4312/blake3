import { BaseHashInput, inputToArray } from '../base/hash-fn';
import { hash as rawHash } from '../../pkg/nodejs/blake3';

/**
 * Input used for browser-based hashes.
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
  // todo: we could probably manipulate or convince the wasm to load into buffers
  // to avoid an extra memory copy here...
  const result = Buffer.from(rawHash(normalizeInput(input)));
  return encoding ? result.toString(encoding) : result;
}
