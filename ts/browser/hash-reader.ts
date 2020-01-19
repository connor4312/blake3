import { BaseHashReader } from '../base/hash-reader';
import { mustGetEncoder, BrowserEncoding } from './encoding';
import { defaultHashLength } from '../base/hash-fn';

/**
 * A hash reader for WebAssembly targets.
 */
export class BrowserHashReader extends BaseHashReader<Uint8Array> {
  /**
   * @override
   */
  public toString(encoding: BrowserEncoding = 'hex'): string {
    return mustGetEncoder(encoding)(this.toArray());
  }

  /**
   * Converts first 32 bytes of the hash to an array.
   */
  public toArray() {
    this.position = BigInt(0);
    return this.read(defaultHashLength);
  }

  protected alloc(bytes: number): Uint8Array {
    return new Uint8Array(bytes);
  }
}
