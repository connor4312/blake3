import { normalizeInput, HashInput } from './hash-fn';
import { BaseHash } from '../base';
import { Blake3Hash } from '../../pkg/nodejs/blake3';

/**
 * @inheritdoc
 */
export class NodeHash extends BaseHash {
  /**
   * @inheritdoc
   * @override
   */
  update(data: HashInput, encoding?: BufferEncoding): this {
    return super.update(normalizeInput(data, encoding));
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
    const result = Buffer.from(super.digest());
    return encoding ? result.toString(encoding) : result;
  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NodeHash(Blake3Hash);
