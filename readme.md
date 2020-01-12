# blake3

[Blake3](https://github.com/BLAKE3-team/BLAKE3) running in JavaScript (node.js and browsers) via WebAssembly. It works, but is not quite done yet.

```
npm install blake3
```

## Quickstart

If you're on Node, import the module via

```js
const blake3 = require('blake3');

blake3.hash('foo'); // => Buffer
```

If you're in the browser, import `blake3/browser`. This includes a WebAssembly binary, so you probably want to import it asynchronously, like so:

```js
import('blake3/browser').then(blake3 => {
  blake3.hash('foo'); // => Uint8Array
});
```

The API is very similar in Node.js and browsers, but Node supports and returns Buffers and a wider range of input and output encoding.

More complete example:

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

### Node.js

The Node API can be imported via `require('blake3')`.

#### `hash(data: BinaryLike, encoding?: string): Buffer | string`

Returns a hash for the given data. The data can be a string, buffer, typedarray, array buffer, or array. If an `encoding` is given, a string will be returned. Otherwise, a Buffer is returned.

#### `createHash()`

Creates a new hasher instance:

#### `hash.update(data: BinaryLike): this`

Adds data to a hash. The data can be a string, buffer, typedarray, array buffer, or array. This will throw if called after `digest()` or `dispose()`.

#### `hash.digest(encoding?: string): Buffer | string`

Returns the hash of the data. If an `encoding` is given, a string will be returned. Otherwise, a Buffer is returned.

#### `hash.dispose()`

Disposes of unmanaged resources. You should _always_ call this if you don't call `digest()` to free umanaged (WebAssembly-based) memory.

### Browser

The browser API can be imported via `import('blake3/browser')`.

#### `hash(data: BinaryLike, encoding?: string): Uint8Array | string`

Returns a hash for the given data. The data can be a string, buffer, typedarray, array buffer, or array. If an `encoding` is given (may be "hex", "base64", or "utf8"), a string will be returned. Otherwise, a Uint8Array is returned.

#### `createHash()`

Creates a new hasher instance:

#### `hash.update(data: BinaryLike): this`

Adds data to a hash. The data can be a string, buffer, typedarray, array buffer, or array. This will throw if called after `digest()` or `dispose()`.

#### `hash.digest(encoding?: string): Uint8Array | string`

Returns the hash of the data. If an `encoding` is given (may be "hex", "base64", or "utf8"), a string will be returned. Otherwise, a Uint8Array is returned.

#### `hash.dispose()`

Disposes of unmanaged resources. You should _always_ call this if you don't call `digest()` to free umanaged (WebAssembly-based) memory.

## Speed

You can run benchmarks by installing `npm install -g @c4312/matcha`, then running `matcha benchmark.js`. These are the results running on Node 12 on my MacBook. Blake3 is, for a small amount of data, significantly faster than Node's native hashing, and for large data about the same as SHA256.

```
    313,000 ops/sec > 64B#md5
    301,000 ops/sec > 64B#sha1
    286,000 ops/sec > 64B#sha256
  1,210,000 ops/sec > 64B#blake3

      11,600 ops/sec > 64KB#md5
      15,800 ops/sec > 64KB#sha1
      7,360 ops/sec > 64KB#sha256
      7,840 ops/sec > 64KB#blake3

        121 ops/sec > 6MB#md5
        171 ops/sec > 6MB#sha1
        78.5 ops/sec > 6MB#sha256
        78.1 ops/sec > 6MB#blake3
```

You may ask, "blake3 is supposed to be incredibly fast, why is this package slower?" One big tool in Blake's arsenal is friendliness to SIMD instructs, which are still at [the proposal stage](https://github.com/WebAssembly/simd) in WebAssembly, at the time of writing, so we can't take advantage of them. Additionally, today we need to manually copy data into WebAssembly, we're unable to reference the memory we already have in JavaScript ([issue](https://github.com/WebAssembly/design/issues/1162)), which is another step that slows things downs. Finally, WebAssembly VMs are still maturing, and will tend to run slower than optimized native code.

Node's built-in crypto uses the native C/++ code to implement their algorithms, bound to V8, thus they can avoid these performance issues. It's almost certain that a native Rust bindings into Node would be significantly faster, but that's not what this module is. With bindings come significantly increased build complexity for consumers and/or package maintainers, unavailability in browsers, and unavailability in some environments which disallow native extensions.

As WebAssembly matures, it's likely that some or all of these limitations will be lifted. You, as a package consumer, should benefit from them for free as time goes on.

## Contributing

This build is a little esoteric due to the mixing of languages. We use a `Makefile` to coodinate things.

To get set up, you'll need the following. Windows users are recommended to use WSL, no effort has been made to make this repo Windows-compatible.

- A recent version of Node.js, such as 12.x
- A `make` command
- [Rust installed locally](https://rustup.rs/)
- `wasm-pack` installed (`cargo install wasm-pack` once you have rust)
- `wasm-opt` to create production releases, part of [Binaryen](https://github.com/WebAssembly/binaryen)

Then, run `make prepare` to install local dependencies.

Finally, `make` will create a build for you; you can run `make MODE=release` for a production release, and certainly should if you want to [benchmark it](#speed).

- Rust code is compiled from `src/lib.rs` to `pkg/browser` and `pkg/node`
- TypeScript code is compiled from `ts/*.ts` into `dist`
