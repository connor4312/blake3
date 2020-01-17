import { normalizeInput } from './hash-fn';
import { HashInput } from '../node/hash-fn';
import native from './native';
import { Transform, TransformCallback } from 'stream';
import { INodeHash } from '../node/hash-instance';
import { defaultHashLength, IBaseHashOptions } from '../base/hash-fn';

/**
 * @inheritdoc
 */
export class NativeHash extends Transform implements INodeHash {
  private readonly hash = new native.Hash();

  /**
   * @inheritdoc
   * @override
   */
  public update(data: HashInput, encoding?: BufferEncoding): this {
    this.hash.update(normalizeInput(data, encoding));
    return this;
  }

  /**
   * @inheritdoc
   */
  public digest(encoding?: IBaseHashOptions): Buffer;
  public digest(encoding: undefined, options: IBaseHashOptions): Buffer;
  public digest(encoding: string, options?: IBaseHashOptions): string;
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

    const result = this.hash.digest(resolvedOpts?.length ?? defaultHashLength);
    return resolvedEnc ? result.toString(resolvedEnc) : result;
  }

  /**
   * @inheritdoc
   */
  public dispose() {}

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
export const createHash = () => new NativeHash();
