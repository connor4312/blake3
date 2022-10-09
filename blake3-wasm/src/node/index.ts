export * from '@c4312/blake3-internal';
export { deriveKey, hash, keyedHash } from './hash-fn';
export * from './hash-instance';

import { setWasm } from '@c4312/blake3-internal';

//@ts-ignore
import blake3 from '../wasm/blake3';

/** Loads the WebAssembly hashing code. This *must* be called before any hashing methods. */
export const load = async () => {
  setWasm(await blake3());
};
