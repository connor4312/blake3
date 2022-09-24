/**
 * The maximum number of bytes that can be read from the hash.
 *
 * Calculated out 2^64-1, since `Xn` syntax (for `Xn ** Yn`) requires TS
 * targeting esnext/es2020 which includes features that Node 10 doesn't
 * yet supported.
 */
export const maxHashBytes = 2n ** 64n - 1n;

/**
 * The HashReader is a type returned from any of the hash functions.
 *
 * You can use it as an iterator, but note that slices returned from the
 * iteration cannot be used outside. of where they were returned from.
 */
export interface IHashReader<T> extends Iterable<Readonly<Uint8Array>> {
  /**
   * Returns the position of the reader in the hash. Can be written to to seek.
   */
  position: bigint;

  /**
   * Reads data from the hash into the target array. The target will always
   * be completely filled with data, unless the end of the hash bytes is
   * reached. The number of written bytes is returned.
   */
  readInto(target: Uint8Array): number;

  /**
   * Reads and returns the given number of bytes from the hash, advancing
   * the position of the reader.
   */
  read(bytes: number): T;

  /**
   * Returns a view of the given number of bytes from the reader. The view can
   * be used synchronously, but must not be reused later. This is more
   * efficient when using the webassembly version of the module.
   *
   * Fewer bytes may be returned than requested, if the number is large (>1MB).
   */
  view(bytes: number): Readonly<Uint8Array>;
}
