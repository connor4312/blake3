import { defaultHashLength, HashInput, IBaseHashOptions, inputToArray } from './hash-fn.js';
import { IHashReader, maxHashBytes } from './hash-reader.js';
import { HashRaw, WasmModule } from './wasm-types.js';

/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export interface IHasher<T> {
  /**
   * Adds the given data to the hash.
   * @throws {Error} if {@link IHash#digest} has already been called.
   */
  update(data: HashInput): this;

  /**
   * Returns a digest of the hash.
   *
   * If `dispose: false` is given in the options, the hash will not
   * automatically be disposed of, allowing you to continue updating
   * it after obtaining the current reader.
   */
  digest(options?: IBaseHashOptions): T;

  /**
   * Returns a {@link HashReader} for the current hash.
   *
   * If `dispose: false` is given in the options, the hash will not
   * automatically be disposed of, allowing you to continue updating
   * it after obtaining the current reader.
   */
  reader(): IHashReader<T>;

  /**
   * Frees memory associated with the hasher. As of 3.x, this is not
   * required to be call since we do so in a finalizer. However, if hashing
   * large amounts of data synchronously, it may be necessary.
   */
  dispose(): void;
}

export abstract class WasmHasher<Binary extends Uint8Array> implements IHasher<Binary> {
  private tookReader = false;

  /** @inhernal */
  constructor(private readonly wasmModule: WasmModule, private hash: HashRaw) {}

  /**
   * Allocates a new binary array of the return type.
   */
  protected abstract alloc(n: number): Binary;

  /** @inheritdoc */
  public update(data: HashInput): this {
    // reuse of the hasher is allowed after digesting, but we don't want to
    // change any readers that were already taken. So clone the hash if the
    // user ends up doing this.
    if (this.tookReader) {
      this.hash = this.hash.clone();
      this.tookReader = false;
    }

    const arr = inputToArray(data);
    const saddr = this.hash.scratch.grow(arr.byteLength);
    const step = this.hash.scratch.size;
    for (let i = 0; i < arr.byteLength; i += step) {
      this.wasmModule.HEAPU8.set(arr.subarray(i, Math.min(arr.length, i + step)), saddr);
      this.hash.update(saddr, arr.byteLength);
    }
    return this;
  }

  /** @inheritdoc */
  public digest({ length = defaultHashLength }: IBaseHashOptions = {}): Binary {
    const out = this.alloc(length);
    const saddr = this.hash.scratch.grow(length);
    const step = this.hash.scratch.size;
    for (let i = 0; i < length; i += step) {
      const n = Math.min(length - i, step);
      this.hash.read(0n, saddr, n);
      out.set(this.wasmModule.HEAPU8.subarray(saddr, saddr + n), i);
    }

    return out;
  }

  /** @inheritdoc */
  public reader(): IHashReader<Binary> {
    const hash = this.hash;
    this.tookReader = true;
    let position = 0n;

    const reader: IHashReader<Binary> = {
      get position() {
        return position;
      },
      set position(value) {
        if (value > maxHashBytes || value < 0n) {
          throw new RangeError(`Hash reader position must be within [0, ${maxHashBytes}]`);
        }
        position = value;
      },
      readInto: (target) => {
        const remaining = Number(maxHashBytes - position);

        const length = remaining > target.byteLength ? target.byteLength : remaining;
        const saddr = this.hash.scratch.grow(length);
        const step = this.hash.scratch.size;
        for (let i = 0; i < length; i += step) {
          const n = Math.min(length - i, step);
          this.hash.read(position, saddr, n);
          position += BigInt(n);
          target.set(this.wasmModule.HEAPU8.subarray(saddr, saddr + n), i);
        }

        return length;
      },
      read: (bytes) => {
        bytes = Math.min(bytes, Number(maxHashBytes - position));
        const out = this.alloc(bytes);
        const saddr = hash.scratch.grow(bytes);
        const step = hash.scratch.size;
        for (let i = 0; i < bytes; i += step) {
          const n = Math.min(bytes - i, step);
          hash.read(position, saddr, n);
          position += BigInt(n);
          out.set(this.wasmModule.HEAPU8.subarray(saddr, saddr + n), i);
        }

        return out;
      },
      view: (bytes) => {
        bytes = Math.min(bytes, Number(maxHashBytes - position));
        const saddr = hash.scratch.grow(bytes);
        hash.read(position, saddr, Math.min(bytes, hash.scratch.size));
        position += BigInt(bytes);
        return this.wasmModule.HEAPU8.subarray(saddr, saddr + bytes);
      },
      *[Symbol.iterator]() {
        const stepSize = 1024n;
        while (position < maxHashBytes) {
          const bytes = maxHashBytes - stepSize < stepSize ? maxHashBytes - stepSize : stepSize;
          yield reader.view(Number(bytes));
        }
      },
    };

    return reader;
  }

  public dispose() {
    this.hash.dispose();
  }
}
