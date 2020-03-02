import { BaseHashInput, IBaseHashOptions, inputToArray, defaultHashLength } from '../base/hash-fn';
import { Hash } from './hash';
import { getWasm } from './wasm';

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
  getWasm().hash(normalizeInput(input), result);
  return result;
}

/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export function deriveKey(
  context: string,
  material: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  const derive = getWasm().create_derive(context);
  derive.update(normalizeInput(material));
  const result = new Hash(length);
  derive.digest(result);
  return result;
}

/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(
  key: Uint8Array,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  if (key.length !== 32) {
    throw new Error(`key provided to keyedHash must be 32 bytes, got ${key.length}`);
  }

  const derive = getWasm().create_keyed(key);
  derive.update(normalizeInput(input));
  const result = new Hash(length);
  derive.digest(result);
  return result;
}
