import { IDisposable } from './disposable';

/**
 * The maximum number of bytes that can be read from the hash.
 *
 * Calculated out 2^64-1, since `Xn` syntax (for `Xn ** Yn`) requires TS
 * targeting esnext/es2020 which includes features that Node 10 doesn't
 * yet supported.
 */
export const maxHashBytes = BigInt('18446744073709551615');

/**
 * The HashReader is a type returned from any of the hash functions. It can
 */
export interface IHashReader<T> extends IDisposable {
  /**
   * Returns the position of the reader in the hash. Can be written to to seek.
   */
  position: bigint;

  /**
   * Reads data from the hash into the target array. The target will always
   * be completely filled with data.
   */
  readInto(target: Uint8Array): void;

  /**
   * Reads and returns the given number of bytes from the hash, advancing
   * the position of the reader.
   */
  read(bytes: number): T;
}

/**
 * Underlying native or wasm module code backing the reader.
 * @hidden
 */
export interface IInternalReader {
  free?(): void;
  fill(target: Uint8Array): void;
  set_position(position: bigint): void;
}

/**
 * Base hash reader implementation.
 */
export abstract class BaseHashReader<T extends Uint8Array> implements IHashReader<T> {
  private reader: IInternalReader | undefined;
  private pos = BigInt(0);

  public get position() {
    return this.pos;
  }

  public set position(value: bigint) {
    // to avoid footguns of people using numbers:
    if (typeof value !== 'bigint') {
      throw new Error(`Got a ${typeof value} set in to reader.position, expected a bigint`);
    }

    this.boundsCheck(value);
    this.pos = value;
    this.reader?.set_position(value);
  }

  constructor(reader: IInternalReader) {
    this.reader = reader;
  }

  /**
   * @inheritdoc
   */
  public readInto(target: Uint8Array): void {
    if (!this.reader) {
      throw new Error(`Cannot read from a hash after it was disposed`);
    }

    const next = this.pos + BigInt(target.length);
    this.boundsCheck(next);
    this.reader.fill(target);
    this.position = next;
  }

  /**
   * @inheritdoc
   */
  public read(bytes: number): T {
    const data = this.alloc(bytes);
    this.readInto(data);
    return data;
  }

  /**
   * @inheritdoc
   */
  public dispose() {
    this.reader?.free?.();
    this.reader = undefined;
  }

  protected abstract alloc(bytes: number): T;

  private boundsCheck(position: BigInt) {
    if (position > maxHashBytes) {
      throw new RangeError(`Cannot read past ${maxHashBytes} bytes in BLAKE3 hashes`);
    }

    if (position < BigInt(0)) {
      throw new RangeError(`Cannot read to a negative position`);
    }
  }
}
