import { BaseHash } from '../base';
import { normalizeInput, HashInput } from './hash-fn';
import { BrowserEncoding, mustGetEncoder } from './encoding';
import { Blake3Hash } from '../../dist/wasm/browser/blake3_js';

/**
 * @inheritdoc
 */
export class BrowserHash extends BaseHash<Uint8Array> {
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
  digest(): Uint8Array;

  /**
   * Returns a digest of the hash with the given encoding.
   */
  digest(encoding: BrowserEncoding): string;
  digest(encoding?: BrowserEncoding): string | Uint8Array {
    const result = super.digest();
    return encoding ? mustGetEncoder(encoding)(result) : result;
  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new BrowserHash(Blake3Hash, new Uint8Array(32));
