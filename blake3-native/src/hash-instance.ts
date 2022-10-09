import { HashInput, IBaseHashOptions, IHasher, IHashReader, inputToArray } from '@c4312/blake3-internal';
import { Transform, TransformCallback } from 'stream';

//@ts-ignore
import * as native from '../build/Release/blake3';

export const createHash = () => new NodeHash(native.createHash());
export const createKeyed = (key: HashInput) => new NodeHash(native.createKeyed(inputToArray(key)));
export const createDeriveKey = (material: HashInput) =>
  new NodeHash(native.createDeriveKey(inputToArray(material)));

/**
 * @inheritdoc
 */
export class NodeHash extends Transform implements IHasher<Buffer> {
  constructor(
    private readonly hash: {
      update(data: Uint8Array): void;
      digest(length?: number): Buffer;
      reader(): IHashReader<Buffer>;
    },
  ) {
    super();
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
    // no-op
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

    const result = this.hash.digest(resolvedOpts?.length);
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
