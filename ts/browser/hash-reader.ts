import { BaseHashReader } from '../base/hash-reader';
import { BrowserEncoding } from './encoding';
import { Hash } from './hash';
import { defaultHashLength } from '../base/index';

/**
 * A hash reader for WebAssembly targets.
 */
export class BrowserHashReader extends BaseHashReader<Hash> {
  /**
   * Converts first 32 bytes of the hash to a string with the given encoding.
   */
  public toString(encoding: BrowserEncoding = 'hex'): string {
    return this.toArray().toString(encoding);
  }

  /**
   * Converts first 32 bytes of the hash to an array.
   */
  public toArray() {
    this.position = BigInt(0);
    return this.read(defaultHashLength);
  }

  protected alloc(bytes: number): Hash {
    return new Hash(bytes);
  }
}
