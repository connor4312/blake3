import * as rawWasm from '../../dist/wasm/browser/blake3_js';

let wasm: typeof rawWasm;

/**
 * Gets the webassembly module provided in provideWasm.
 */
export const getWasm = () => {
  if (!wasm) {
    throw new Error(
      'BLAKE3 webassembly not loaded. Please import the module via `blake3/browser` or `blake3/browser-async`',
    );
  }

  return wasm;
};

/**
 * Sets the webassembly module used for the browser build. This indirection is
 * needed to provide compatibility between the "browser" and "browser-async" modes.
 */
export const provideWasm = (w: typeof rawWasm) => {
  wasm = w;
};
