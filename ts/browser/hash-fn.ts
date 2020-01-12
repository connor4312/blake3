import { BaseHashInput, inputToArray } from '../base/hash-fn';
import { hash as rawHash } from '../../pkg/browser/blake3';
import { BrowserEncoding, mustGetEncoder } from './encoding';

export { BrowserEncoding as BrowserEncodings } from './encoding';

/**
 * Input used for browser-based hashes.
 */
export type HashInput = BaseHashInput | string;

const textEncoder = new TextEncoder();

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput): Uint8Array =>
  inputToArray(typeof input === 'string' ? textEncoder.encode(input) : input);

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(input: HashInput): Uint8Array;

/**
 * Returns a blake3 hash of the input, returning the hash encoding with the
 * requested encoding.
 */
export function hash(input: HashInput, encoding: BrowserEncoding): string;
export function hash(input: HashInput, encoding?: BrowserEncoding): Uint8Array | string {
  const result = new Uint8Array(32);
  rawHash(normalizeInput(input), result);
  return encoding ? mustGetEncoder(encoding)(result) : result;
}
