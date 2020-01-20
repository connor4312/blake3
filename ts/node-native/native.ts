import { IInternalHash } from '../base';

export interface INativeReader {
  free?(): void;
  fill(target: Uint8Array): void;
  set_position(position: Buffer): void;
}

export interface INativeHash extends IInternalHash<INativeReader> {
  new (): INativeHash;
}

export interface INativeModule {
  Hasher: INativeHash;
  hash(input: Buffer, length: number): Buffer;
}

const native: INativeModule = require('../native.node');

export default native;
