import { normalizeInput } from './hash-fn';
import { IHash } from '../base';
import { HashInput } from '../node/hash-fn';
import native from './native';
import { Transform, TransformCallback } from 'stream';

/**
 * @inheritdoc
 */
export class NativeHash extends Transform implements IHash<Buffer> {
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
   * @override
   */
  public digest(): Buffer;

  /**
   * Returns a digest of the hash with the given encoding.
   */
  public digest(encoding: BufferEncoding): string;
  public digest(encoding?: BufferEncoding): string | Buffer {
    const result = this.hash.digest();
    return encoding ? result.toString(encoding) : result;
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
