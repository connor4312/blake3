import { getWasm, MAX_SCRATCH_SIZE, scratch } from './wasm-types.js';

export const hashOneShot = (input: Uint8Array, hashLength: number) => {
  scratch.grow(input.length + hashLength);
  const wasm = getWasm();

  const hashIsInScratch = hashLength <= MAX_SCRATCH_SIZE;
  const inputIsInScratch = hashLength + input.length <= MAX_SCRATCH_SIZE;
  const scratchAddr = scratch.grow(
    (hashIsInScratch ? hashLength : 0) + (inputIsInScratch ? input.length : 0),
  );

  const hashAddr = hashIsInScratch ? scratchAddr : wasm._malloc(hashLength);
  const inputAddr = inputIsInScratch
    ? hashIsInScratch
      ? scratchAddr + hashLength
      : scratchAddr
    : wasm._malloc(input.length);

  wasm.HEAPU8.set(input, inputAddr);

  wasm.ccall(
    'hash_oneshot',
    null,
    ['number', 'number', 'number', 'number'],
    [inputAddr, input.length, hashAddr, hashLength],
  );

  if (!inputIsInScratch) {
    wasm._free(inputAddr);
  }
  if (!hashIsInScratch) {
    wasm._free(hashAddr);
  }

  // kinda use after free, but as long as we (internal caller) consumes it
  // synchronously, it's fine.
  return wasm.HEAPU8.subarray(hashAddr, hashAddr + hashLength);
};
