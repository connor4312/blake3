import { defaultHashLength, HashInput, IBaseHashOptions, inputToArray } from '../base/hash-fn.js';
import { hashOneShot } from '../base/hash-oneshots.js';
import { createDeriveKey, createKeyed } from './hash-instance.js';
import { Hash } from './hash.js';

/**
 * Returns a blake3 hash of the input.
 */
export function hash(
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
): Hash {
  const hash = new Hash(length);
  hash.set(hashOneShot(inputToArray(input), length));
  return hash;
}

/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export function deriveKey(
  context: HashInput,
  material: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  const derive = createDeriveKey(context);
  derive.update(inputToArray(material));
  const digest = derive.digest({ length });
  derive.dispose();
  return digest;
}

/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(
  key: HashInput,
  input: HashInput,
  { length = defaultHashLength }: IBaseHashOptions = {},
) {
  const keyed = createKeyed(inputToArray(key));
  keyed.update(inputToArray(input));
  const digest = keyed.digest({ length });
  keyed.dispose();
  return digest;
}
