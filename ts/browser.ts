import init from '../pkg/web/blake3';
import { createModule, IBlake3Raw, HashInput as RawHashInput, Hash as RawHash } from './blake3';

export type HashInput = RawHashInput | string;

const encoder = new TextEncoder();
const normalizeInput = (input: HashInput): RawHashInput =>
  typeof input === 'string' ? encoder.encode(input) : input;

export interface IBlake3Browser extends IBlake3Raw {
  /**
   * @inheritdoc
   */
  hash(data: HashInput): Uint8Array;

  /**
   * @inheritdoc
   */
  createHash(): Hash;
}

/**
 * @inheritdoc
 */
export class Hash extends RawHash {
  /**
   * @inheritdoc
   * @override
   */
  update(data: HashInput): this {
    return super.update(normalizeInput(data));
  }
}

const extend = (plain: IBlake3Raw): IBlake3Browser => ({
  ...plain,
  hash: data => plain.hash(normalizeInput(data)),
  createHash: () => new Hash(plain.instance),
});

/**
 * Creates a module loading the webassembly binary from the given location.
 * The wasm image can be found in `dist/web/blake3_bg.wasm` in this node module.
 */
export default (location: RequestInfo | BufferSource | WebAssembly.Module) =>
  init(location).then(m => extend(createModule(m)));
