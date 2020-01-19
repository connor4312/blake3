export interface INativeHash {
  new (): INativeHash;
  update(data: Uint8Array): void;
  digest(targte: Uint8Array): void;
  free(): void;
}

export interface INativeModule {
  Hasher: INativeHash;
  hash(input: Buffer, length: number): Buffer;
}

const native: INativeModule = require('../native.node');

export default native;
