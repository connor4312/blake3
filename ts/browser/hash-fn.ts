import { BaseHashInput, IBaseHashOptions, inputToArray, defaultHashLength } from '../base/hash-fn';
import { hash as rawHash } from '../../dist/wasm/browser/blake3_js';
import { Hash } from './hash';

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
 * Returns a blake3 hash of the input.
 */
export function hash(
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Hash {
  const result = new Hash(length);
  rawHash(normalizeInput(input), result);
  return result;
}
