export interface WasmModule {
  HEAPU8: Uint8Array;
  _free(addr: number): void;
  _malloc(bytes: number): number;
  ccall<T extends number | boolean>(...args: unknown[]): T;
}

let globalWasm: WasmModule | undefined;

export const setWasm = (m: WasmModule) => (globalWasm = m);

export const getWasm = () => {
  if (!globalWasm) {
    throw new Error(`Make sure to await blake3.load() before trying to use any functions`);
  }

  return globalWasm;
};

const memoryDeallocator = new FinalizationRegistry<{
  wasm: WasmModule;
  address: number;
}>((v) => v.wasm._free(v.address));

export const MAX_SCRATCH_SIZE = 1024 * 1024;

class Scratch {
  private addr?: number;
  private scratchSize = 32;

  public get size() {
    return this.scratchSize;
  }

  grow(n: number): number {
    let grew = false;
    while (this.scratchSize < n && this.scratchSize < MAX_SCRATCH_SIZE) {
      this.scratchSize <<= 1;
      grew = true;
    }

    if (!grew && this.addr !== undefined) {
      return this.addr;
    }

    const wasm = getWasm();
    if (this.addr !== undefined) {
      memoryDeallocator.unregister(this);
      wasm._free(this.addr);
    }

    return (this.addr = wasm._malloc(this.scratchSize));
  }
}

export const scratch = new Scratch();

export class HashRaw {
  public static default() {
    return new HashRaw(getWasm().ccall<number>('hasher_init', 'number', [], []));
  }

  public static keyed(key: Uint8Array | Uint8ClampedArray) {
    if (key.byteLength !== 32) {
      throw new RangeError(`BLAKE3 key must be exactly 32 bytes long`);
    }
    const wasm = getWasm();
    const saddr = scratch.grow(32);
    wasm.HEAPU8.set(key, saddr);
    return new HashRaw(wasm.ccall('hasher_init_keyed', 'number', ['number'], [saddr]));
  }

  public static derive(key: Uint8Array) {
    const wasm = getWasm();
    const saddr = scratch.grow(key.byteLength);
    wasm.HEAPU8.set(key, saddr);
    return new HashRaw(
      wasm.ccall('hasher_init_derive', 'number', ['number', 'number'], [saddr, key.byteLength]),
    );
  }

  private addr?: { wasm: WasmModule; address: number };
  public readonly scratch = scratch;

  constructor(private hasher: number) {
    this.addr = { wasm: getWasm(), address: hasher };
    memoryDeallocator.register(this, this.addr, this);
  }

  update(address: number, length: number) {
    if (!this.addr) {
      throw new Error('Cannot use a hash after disposing it');
    }

    this.addr.wasm.ccall(
      'hasher_update',
      null,
      ['number', 'number', 'number'],
      [this.hasher, address, length],
    );
  }

  read(seek: bigint, address: number, length: number) {
    if (!this.addr) {
      throw new Error('Cannot use a hash after disposing it');
    }

    this.addr.wasm.ccall(
      'hasher_read',
      null,
      ['number', 'number', 'number', 'number', 'number'],
      [this.hasher, Number(seek >> 32n), Number(seek & 0xffffffffn), address, length],
    );
  }

  clone() {
    if (!this.addr) {
      throw new Error('Cannot use a hash after disposing it');
    }

    const addr = this.addr.wasm.ccall<number>('clone_hasher', null, ['number'], [this.hasher]);
    return new HashRaw(addr);
  }

  public dispose() {
    if (this.addr) {
      memoryDeallocator.unregister(this);
      this.addr.wasm._free(this.addr.address);
      this.addr = undefined;
    }
  }
}
