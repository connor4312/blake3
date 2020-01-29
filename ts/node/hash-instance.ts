import { normalizeInput, HashInput } from './hash-fn';
import { BaseHash, IHasher, IInternalHash, IHasherDigestOptions } from '../base';
import { Transform, TransformCallback } from 'stream';
import { IBaseHashOptions } from '../base/hash-fn';
import { getWasm } from './wasm';
import { NodeHashReader } from './hash-reader';

export interface INodeHash extends IHasher<Buffer> {
  /**
   * @inheritdoc
   * @override
   */
  update(data: HashInput, encoding?: BufferEncoding): this;

  /**
   * @inheritdoc
   * @override
   */
  digest(options?: IBaseHashOptions): Buffer;

  /**
   * Returns a digest of the hash with the given set of hash options.
   */
  digest(encoding: undefined, options: IBaseHashOptions): Buffer;

  /**
   * Returns a digest of the hash with the given encoding.
   */
  digest(encoding: BufferEncoding, options?: IBaseHashOptions): string;
}

/**
 * @inheritdoc
 */
export class NodeHash<Reader> extends Transform implements IHasher<Buffer> {
  private readonly hash: BaseHash<Buffer, Reader, NodeHashReader>;

  constructor(implementation: IInternalHash<Reader>, getReader: (r: Reader) => NodeHashReader) {
    super();
    this.hash = new BaseHash(implementation, l => Buffer.alloc(l), getReader);
  }

  /**
   * @reader
   */
  public reader(options?: { dispose?: boolean }) {
    const reader = this.hash.reader(options);
    return reader;
  }

  /**
   * @inheritdoc
   */
  public update(data: HashInput, encoding?: BufferEncoding): this {
    this.hash.update(normalizeInput(data, encoding));
    return this;
  }

  /**
   * @inheritdoc
   */
  public digest(encoding?: IHasherDigestOptions): Buffer;
  public digest(encoding: undefined, options: IHasherDigestOptions): Buffer;
  public digest(encoding: BufferEncoding, options?: IHasherDigestOptions): string;
  public digest(
    encoding?: IHasherDigestOptions | BufferEncoding,
    options?: IHasherDigestOptions,
  ): string | Buffer {
    let resolvedOpts: IHasherDigestOptions | undefined;
    let resolvedEnc: BufferEncoding | undefined;
    if (encoding && typeof encoding === 'object') {
      resolvedOpts = encoding;
      resolvedEnc = undefined;
    } else {
      resolvedOpts = options;
      resolvedEnc = encoding;
    }

    const result = this.hash.digest(resolvedOpts);
    return resolvedEnc ? result.toString(resolvedEnc) : result;
  }

  /**
   * @inheritdoc
   */
  public dispose() {
    this.hash.dispose();
  }

  /**
   * @inheritdoc
   * @hidden
   */
  _transform(chunk: Buffer | string, encoding: string, callback: TransformCallback): void {
    this.update(chunk, encoding as BufferEncoding);
    callback();
  }

  /**
   * @inheritdoc
   * @hidden
   */
  _flush(callback: TransformCallback): void {
    callback(null, this.digest());
  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NodeHash(getWasm().create_hasher(), r => new NodeHashReader(r));

/**
 * Construct a new Hasher for the keyed hash function.
 */
export const createKeyed = (key: Buffer) =>
  new NodeHash(getWasm().create_keyed(key), r => new NodeHashReader(r));

/**
 * Construct a new Hasher for the key derivation function.
 */
export const createDeriveKey = (context: string) =>
  new NodeHash(getWasm().create_derive(context), r => new NodeHashReader(r));
