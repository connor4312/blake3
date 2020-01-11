import { createModule, IBlake3Raw, HashInput as RawHashInput, Hash as RawHash } from './blake3';

export type HashInput = RawHashInput | string;

const normalizeInput = (input: HashInput, encoding?: BufferEncoding): RawHashInput =>
  typeof input === 'string' ? Buffer.from(input, encoding) : input;

export interface IBlake3Node extends IBlake3Raw {
  /**
   * @inheritdoc
   */
  hash(data: HashInput, encoding?: BufferEncoding): Buffer;

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

  /**
   * @inheritdoc
   * @override
   */
  digest(): Buffer;

  /**
   * Returns a digest of the hash with the given encoding.
   */
  digest(encoding: BufferEncoding): string;
  digest(encoding?: BufferEncoding): string | Buffer {
    const bytes = Buffer.from(super.digest());
    return encoding ? bytes.toString(encoding) : bytes;
  }
}

const plain = createModule(require('../pkg/nodejs/blake3'));

/**
 * Raw WebAssembly blake3 instance.
 */
export const instance = plain.instance;

/**
 * Returns a hash from the input data.
 */
export const hash = (data: HashInput, inputEncoding?: BufferEncoding): Buffer =>
  Buffer.from(plain.hash(normalizeInput(data, inputEncoding)));

/**
 * Creates a new {@link Hash} which can be appended to.
 */
export const createHash = () => new Hash(instance);
