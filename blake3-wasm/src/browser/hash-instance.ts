import {
  getWasm,
  HashInput,
  HashRaw,
  IBaseHashOptions,
  inputToArray,
  WasmHasher,
} from '@c4312/blake3-internal';
import { BrowserEncoding, mustGetEncoder } from './encoding.js';
import { Hash } from './hash.js';

/**
 * @inheritdoc
 */
export class BrowserHasher extends WasmHasher<Hash> {
  protected alloc(n: number): Hash {
    return new Hash(n);
  }

  /**
   * @inheritdoc
   * @override
   */
  public update(data: HashInput): this {
    return super.update(inputToArray(data));
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
export const createHash = () => new BrowserHasher(getWasm(), HashRaw.default());

/**
 * A Node.js crypto-like createHash method.
 */
export const createKeyed = (key: HashInput) =>
  new BrowserHasher(getWasm(), HashRaw.keyed(inputToArray(key)));

/**
 * Construct a new Hasher for the key derivation function.
 */
export const createDeriveKey = (context: HashInput) =>
  new BrowserHasher(getWasm(), HashRaw.derive(inputToArray(context)));
