import { BaseHashReader } from '../base/hash-reader';
import { defaultHashLength } from '../base/hash-fn';

/**
 * A hash reader for WebAssembly targets.
 */
export class NodeHashReader extends BaseHashReader<Buffer> {
  /**
   * Converts first 32 bytes of the hash to a string with the given encoding.
   */
  public toString(encoding: BufferEncoding = 'hex'): string {
    return this.toBuffer().toString(encoding);
  }

  /**
   * Converts first 32 bytes of the hash to an array.
   */
  public toBuffer() {
    this.position = BigInt(0);
    return this.read(defaultHashLength);
  }

  protected alloc(bytes: number): Buffer {
    return Buffer.alloc(bytes);
  }
}
