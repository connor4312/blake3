import { normalizeInput } from './hash-fn';
import { IHash } from '../base';
import { HashInput } from '../node/hash-fn';
import native from './native';

/**
 * @inheritdoc
 */
export class NativeHash implements IHash<Buffer> {
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
  public dispose() {

  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NativeHash();
