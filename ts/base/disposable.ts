/**
 * A type which requires manual disposal to free unmanaged resources. In the
 * context of this library, this usually means freeing memory from WebAssembly
 * code.
 */
export interface IDisposable {
  /**
   * Frees unmanaged resources of the object. This method is idempotent;
   * calling it multiple times will have no ill effects.
   */
  dispose(): void;
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' && !!value && 'then' in value;

/**
 * A helper function that calls `.dispose()` on the {@link IDisposable} when
 * the given function (or promise returned by the function) returns.
 */
export const using = <T, D extends IDisposable>(disposable: D, fn: (d: D) => T): T => {
  let ret: Promise<T> | T;
  try {
    ret = fn(disposable);
  } catch (e) {
    disposable.dispose();
    throw e;
  }

  if (!isPromiseLike(ret)) {
    disposable.dispose();
    return ret;
  }

  return (ret.then(
    value => {
      disposable.dispose();
      return value;
    },
    err => {
      disposable.dispose();
      throw err;
    },
  ) as unknown) as T;
};
