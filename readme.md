# blake3

[Blake3](https://github.com/BLAKE3-team/BLAKE3) running in Node via WebAssembly. It works, but is not quite done yet.

```
npm install blake3
```

## Quickstart

```js
const { hash, createHash } = require('blake3');

hash('some string'); // => hash a string to a uint8array

// Stream like you normally do:
const hash = createHash();
stream.on('data', d => hash.update(hash));
stream.on('error', err => {
  // hashes use unmanaged memory in WebAssembly, always free them if you don't digest()!
  hash.dispose();
  throw err;
});
stream.on('end', () => finishedHash(hash.digest()));
```

## API

### `hash(data: BinaryLike): Uint8Array`

Returns a hash for the given data. The data can be a string, buffer, typedarray, array buffer, or array.

Note that it returns {@link Uint8Array}s instead of buffers for browser compatibility. You can convert to a buffer using `Buffer.from(hash.digest())`.

### `createHash()`

Creates a new hasher instance.

### `hash.update(data: BinaryLike): this`

Adds data to a hash. The data can be a string, buffer, typedarray, array buffer, or array. This will throw if called after `digest()` or `dispose()`.

### `hash.digest(): Uint8Array`

Returns the hash of the data. Note that it returns {@link Uint8Array}s instead of buffers for browser compatibility. You can convert to a buffer using `Buffer.from(hash.digest())`.

### `hash.dispose()`

Disposes of unmanaged resources.
