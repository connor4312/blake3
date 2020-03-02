import { BaseHash as BaseHasher } from '../base/index';
import { normalizeInput, HashInput } from './hash-fn';
import { BrowserEncoding, mustGetEncoder } from './encoding';
import { IBaseHashOptions } from '../base/hash-fn';
import { BrowserHashReader } from './hash-reader';
import { IInternalReader } from '../base/hash-reader';
import { Hash } from './hash';
import { getWasm } from './wasm';

/**
 * @inheritdoc
 */
export class BrowserHasher extends BaseHasher<Hash, IInternalReader, BrowserHashReader> {
  /**
   * @inheritdoc
   * @override
   */
  public update(data: HashInput): this {
    return super.update(normalizeInput(data));
  }

  /**
   * Returns a digest of the hash with the given encoding.
   */
  public digest(options?: IBaseHashOptions): Hash;
  public digest(encoding: undefined, options: IBaseHashOptions): Hash;
  public digest(encoding: BrowserEncoding, options?: IBaseHashOptions): string;
  public digest(
    encoding?: IBaseHashOptions | BrowserEncoding,
    options?: IBaseHashOptions,
  ): string | Hash {
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
export const createHash = () =>
  new BrowserHasher(
    getWasm().create_hasher(),
    l => new Hash(l),
    r => new BrowserHashReader(r),
  );

/**
 * A Node.js crypto-like createHash method.
 */
export const createKeyed = (key: Uint8Array) =>
  new BrowserHasher(
    getWasm().create_keyed(key),
    l => new Hash(l),
    r => new BrowserHashReader(r),
  );
