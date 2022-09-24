export * from '../base/index.js';
export { deriveKey, hash, keyedHash } from './hash-fn.js';
export * from './hash-instance.js';

//@ts-ignore
import blake3 from '../../dist/wasm/esm/blake3.mjs';
import { setWasm } from '../base/index.js';

/** Loads the WebAssembly hashing code. This *must* be called before any hashing methods. */
export const load = async () => {
  setWasm(await blake3());
};
