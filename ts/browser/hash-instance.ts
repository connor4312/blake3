import { BaseHash } from '../base';
import { normalizeInput, HashInput } from './hash-fn';
import { BrowserEncoding, mustGetEncoder } from './encoding';
import { Blake3Hash } from '../../dist/wasm/browser/blake3_js';
import { IBaseHashOptions } from '../base/hash-fn';

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
  public digest(encoding?: IBaseHashOptions): Uint8Array;
  public digest(encoding: undefined, options: IBaseHashOptions): Uint8Array;
  public digest(encoding: BrowserEncoding, options?: IBaseHashOptions): string;
  public digest(
    encoding?: IBaseHashOptions | BrowserEncoding,
    options?: IBaseHashOptions,
  ): string | Uint8Array {
    let resolvedOpts: IBaseHashOptions | undefined;
    let resolvedEnc: BrowserEncoding | undefined;
    if (encoding && typeof encoding === 'object') {
      resolvedOpts = encoding;
      resolvedEnc = undefined;
    } else {
      resolvedOpts = options;
      resolvedEnc = encoding;
    }

    const result = super.digest(resolvedOpts);
    return resolvedEnc ? mustGetEncoder(resolvedEnc)(result) : result;
  }
}

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new BrowserHash(Blake3Hash, l => new Uint8Array(l));
