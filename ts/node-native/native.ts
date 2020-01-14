export interface INativeHash {
  new(): INativeHash;
  update(data: Buffer): void;
  digest(): Buffer;
}

export interface INativeModule {
  Hash: INativeHash;
  hash(input: Buffer): Buffer;
}

const native: INativeModule = require('../native.node');

export default native;

