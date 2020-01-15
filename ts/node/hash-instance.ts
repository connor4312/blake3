import { normalizeInput, HashInput } from './hash-fn';
import { BaseHash, IHash } from '../base';
import { Blake3Hash } from '../../dist/wasm/nodejs/blake3_js';
import { Transform, TransformCallback } from 'stream';

/**
 * @inheritdoc
 */
export class NodeHash extends Transform implements IHash<Buffer> {
  private readonly hash = new BaseHash(Blake3Hash, Buffer.alloc(32));

  /**
   * @inheritdoc
   * @override
   */
  update(data: HashInput, encoding?: BufferEncoding): this {
    this.hash.update(normalizeInput(data, encoding));
    return this;
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
    const result = this.hash.digest();
    return encoding ? result.toString(encoding) : result;
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
export const createHash = () => new NodeHash();
