export * from '@c4312/blake3-internal';
export { deriveKey, hash, keyedHash } from './hash-fn.js';
export * from './hash-instance.js';
import { setWasm } from '@c4312/blake3-internal';

//@ts-ignore
import blake3 from '../../esm/wasm/blake3.mjs';

/** Loads the WebAssembly hashing code. This *must* be called before any hashing methods. */
export const load = async () => {
  setWasm(await blake3());
};
