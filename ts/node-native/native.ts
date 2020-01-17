export interface INativeHash {
  new (): INativeHash;
  update(data: Buffer): void;
  digest(length: number): Buffer;
}

export interface INativeModule {
  Hash: INativeHash;
  hash(input: Buffer, length: number): Buffer;
}

const native: INativeModule = require('../native.node');

export default native;
