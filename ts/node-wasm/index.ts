export * from '../base/index';
export { deriveKey, hash, keyedHash } from './hash-fn';
export * from './hash-instance';

import { setWasm } from '../base/index';

//@ts-ignore
import blake3 from '../../dist/wasm/cjs/blake3';

/** Loads the WebAssembly hashing code. This *must* be called before any hashing methods. */
export const load = async () => {
  setWasm(await blake3());
};
