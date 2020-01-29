import { BaseHashInput, inputToArray, IBaseHashOptions, defaultHashLength } from '../base/hash-fn';
import {
  hash as rawHash,
  create_derive as createDerive,
  create_keyed as createKeyed,
} from '../../dist/wasm/nodejs/blake3_js';

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
  const derive = createDerive(context);
  derive.update(normalizeInput(material));
  const result = Buffer.alloc(length);
  derive.digest(result);
  return result;
}

/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(
  key: Buffer,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  if (key.length !== 32) {
    throw new Error(`key provided to keyedHash must be 32 bytes, got ${key.length}`);
  }

  const derive = createKeyed(key);
  derive.update(normalizeInput(input));
  const result = Buffer.alloc(length);
  derive.digest(result);
  return result;
}
