import { Transform, TransformCallback } from 'stream';
import { getWasm, HashRaw, IHasher, WasmHasher } from '../base';
import { HashInput, IBaseHashOptions, inputToArray } from '../base/hash-fn';

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

class BufferHash extends WasmHasher<Buffer> {
  protected alloc(n: number): Buffer {
    return Buffer.allocUnsafe(n);
  }
}

/**
 * @inheritdoc
 */
export class NodeHash extends Transform implements IHasher<Buffer> {
  private readonly hash: BufferHash;

  constructor(wasmModule: any, hasher: HashRaw) {
    super();
    this.hash = new BufferHash(wasmModule, hasher);
  }

  /**
   * @reader
   */
  public reader() {
    return this.hash.reader();
  }

  /**
   * @inheritdoc
   */
  public update(data: HashInput, encoding?: BufferEncoding): this {
    this.hash.update(
      encoding && typeof data === 'string' ? Buffer.from(data, encoding) : inputToArray(data),
    );
    return this;
  }

  /**
   * @inheritdoc
   */
  public dispose(): void {
    this.hash.dispose();
  }

  /**
   * @inheritdoc
   */
  public digest(encoding?: IBaseHashOptions): Buffer;
  public digest(encoding: undefined, options: IBaseHashOptions): Buffer;
  public digest(encoding: BufferEncoding, options?: IBaseHashOptions): string;
  public digest(
    encoding?: IBaseHashOptions | BufferEncoding,
    options?: IBaseHashOptions,
  ): string | Buffer {
    let resolvedOpts: IBaseHashOptions | undefined;
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
   * @hidden
   */
  override _transform(chunk: Buffer | string, encoding: string, callback: TransformCallback): void {
    this.update(chunk, encoding as BufferEncoding);
    callback();
  }

  /**
   * @inheritdoc
   * @hidden
   */
  override _flush(callback: TransformCallback): void {
    callback(null, this.digest());
  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NodeHash(getWasm(), HashRaw.default());

/**
 * Construct a new Hasher for the keyed hash function.
 */
export const createKeyed = (key: HashInput) =>
  new NodeHash(getWasm(), HashRaw.keyed(inputToArray(key)));

/**
 * Construct a new Hasher for the key derivation function.
 */
export const createDeriveKey = (context: HashInput) =>
  new NodeHash(getWasm(), HashRaw.derive(inputToArray(context)));
