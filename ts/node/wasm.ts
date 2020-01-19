import * as wasm from '../../dist/wasm/nodejs/blake3_js';

let w: typeof wasm | undefined;

/**
 * Lazyily get the WebAssembly module. Used to avoid unnecessarily importing
 * the wasm when extending the WebAssembly node code for native bindings.
 */
export const getWasm = () => {
  if (!w) {
    w = require('../../dist/wasm/nodejs/blake3_js') as typeof wasm;
  }

  return w;
};
