# BLAKE3

[BLAKE3](https://github.com/BLAKE3-team/BLAKE3) running in JavaScript (node.js and browsers) via native bindings, where available, or WebAssembly.

    npm install blake3

Additionally, there's a flavor of the package which is identical except that it will not download native Node.js bindings and use only WebAssembly:

    npm install blake3-wasm

## Table of Contents

- [Quickstart](#quickstart)
- [API](#api)
  - [Node.js](#nodejs)
    - [`hash(data: BinaryLike, options?: { length: number }): Buffer`](#hashdata-binarylike-options--length-number--buffer)
    - [`keyedHash(key: BinaryLike, data: BinaryLike, options?: { length: number }): Buffer`](#keyedhashkey-binarylike-data-binarylike-options--length-number--buffer)
    - [`deriveKey(context: BinaryLike, material: BinaryLike, options?: { length: number }): Buffer`](#derivekeycontext-binarylike-material-binarylike-options--length-number--buffer)
    - [Hasher](#hasher)
      - [`createHash(): Hasher`](#createhash-hasher)
      - [`createKeyed(key: BinaryLike): Hasher`](#createkeyedkey-binarylike-hasher)
      - [`createDeriveKey(context: BinaryLike): Hasher`](#createderivekeycontext-binarylike-hasher)
      - [`hasher.update(data: BinaryLike): this`](#hasherupdatedata-binarylike-this)
      - [`hasher.digest(encoding?: string, options?: { length: number })): Buffer | string`](#hasherdigestencoding-string-options--length-number--buffer--string)
      - [`hasher.reader(): HashReader`](#hasherreader-hashreader)
      - [`hasher.dispose()`](#hasherdispose)
    - [HashReader](#hashreader)
      - [`reader.position: bigint`](#readerposition-bigint)
      - [`reader.readInto(target: Uint8Array): number`](#readerreadintotarget-uint8array-number)
      - [`reader.read(bytes: number): Buffer`](#readerreadbytes-number-buffer)
      - [`reader.view(target: Buffer): Readonly<Uint8Array>`](#readerviewtarget-buffer-readonlyuint8array)
      - [`reader[Symbol.iterator]`](#readersymboliterator)
  - [Browser](#browser)
    - [`hash(data: BinaryLike, options?: { length: number }): Hash`](#hashdata-binarylike-options--length-number--hash)
    - [`keyedHash(key: BinaryLike, data: BinaryLike, options?: { length: number }): Hash`](#keyedhashkey-binarylike-data-binarylike-options--length-number--hash)
    - [`deriveKey(context: BinaryLike, material: BinaryLike, options?: { length: number }): Hash`](#derivekeycontext-binarylike-material-binarylike-options--length-number--hash)
    - [`Hash`](#hash)
      - [`hash.equals(other: Uint8Array)`](#hashequalsother-uint8array)
      - [`hash.toString(encoding: 'hex' | 'base64' | 'utf8'): string`](#hashtostringencoding-hex--base64--utf8-string)
    - [Hasher](#hasher-1)
      - [`createHash(): Hasher`](#createhash-hasher-1)
      - [`createKeyed(key: BinaryLike): Hasher`](#createkeyedkey-binarylike-hasher-1)
      - [`createDeriveKey(context: BinaryLike): Hasher`](#createderivekeycontext-binarylike-hasher-1)
      - [`hasher.update(data: BinaryLike): this`](#hasherupdatedata-binarylike-this-1)
      - [`hasher.digest(encoding?: 'hex' | 'base64' | 'utf8', options?: { length: number })): Hash | string`](#hasherdigestencoding-hex--base64--utf8-options--length-number--hash--string)
      - [`hasher.reader(): HashReader`](#hasherreader-hashreader-1)
      - [`hasher.dispose()`](#hasherdispose-1)
    - [HashReader](#hashreader-1)
      - [`reader.position: bigint`](#readerposition-bigint-1)
      - [`reader.readInto(target: Uint8Array): number`](#readerreadintotarget-uint8array-number-1)
      - [`reader.read(bytes: number): Hash`](#readerreadbytes-number-hash)
      - [`reader.view(target: Buffer): Readonly<Uint8Array>`](#readerviewtarget-buffer-readonlyuint8array-1)
      - [`reader[Symbol.iterator]`](#readersymboliterator-1)
- [Speed](#speed)
- [Other (JS) Implementations](#other-js-implementations)
- [Contributing](#contributing)
  - [Publishing](#publishing)

## Quickstart

If you're on Node, import the module via

```js
const blake3 = require('blake3');

blake3.hash('foo'); // => Buffer
```

If you're in the browser, import `blake3/browser`. This includes a WebAssembly binary, so you probably want to import it asynchronously, like so:

```js
import('blake3/browser').then((blake3) => {
  blake3.hash('foo'); // => Uint8Array
});
```

The API is very similar in Node.js and browsers, but Node supports and returns Buffers and a wider range of input and output encoding.

More complete example:

```js
const { hash, createHash } = require('blake3');

hash('some string'); // => hash a string to a uint8array

// Update incrementally (Node and Browsers):
const hash = createHash();
stream.on('data', (d) => hash.update(d));
stream.on('error', (err) => {
  // hashes use unmanaged memory in WebAssembly, always free them if you don't digest()!
  hash.dispose();
  throw err;
});
stream.on('end', () => finishedHash(hash.digest()));

// Or, in Node, it's also a transform stream:
createReadStream('file.txt')
  .pipe(createHash())
  .on('data', (hash) => console.log(hash.toString('hex')));
```

## API

### Node.js

The Node API can be imported via `require('blake3')`.

#### `hash(data: BinaryLike, options?: { length: number }): Buffer`

Returns a hash for the given data. The data can be a string, buffer, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a Buffer.

#### `keyedHash(key: BinaryLike, data: BinaryLike, options?: { length: number }): Buffer`

Returns keyed a hash for the given data. The key must be exactly 32 bytes. The data can be a string, buffer, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a Buffer.

For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html).

#### `deriveKey(context: BinaryLike, material: BinaryLike, options?: { length: number }): Buffer`

The key derivation function. The data can be a string, buffer, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a Buffer.

For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html).

#### Hasher

The hasher is a type that lets you incrementally build a hash. It's compatible with Node's crypto hash instance. For instance, it implements a transform stream, so you could do something like:

```js
createReadStream('file.txt')
  .pipe(createHash())
  .on('data', (hash) => console.log(hash.toString('hex')));
```

##### `createHash(): Hasher`

Creates a new hasher instance using the standard hash function.

##### `createKeyed(key: BinaryLike): Hasher`

Creates a new hasher instance for a keyed hash. For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html).

##### `createDeriveKey(context: BinaryLike): Hasher`

Creates a new hasher instance for the key derivation function. For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html).

##### `hasher.update(data: BinaryLike): this`

Adds data to a hash. The data can be a string, buffer, typedarray, array buffer, or array.

##### `hasher.digest(encoding?: string, options?: { length: number })): Buffer | string`

Returns the hash of the data. If an `encoding` is given, a string will be returned. Otherwise, a Buffer is returned. Optionally, you can specify the requested byte length of the hash.

##### `hasher.reader(): HashReader`

Returns a [HashReader](#HashReader) for the current hash.

##### `hasher.dispose()`

This is a no-op for Node.js.

#### HashReader

The hash reader can be returned from hashing functions. Up to 2<sup>64</sup>-1 bytes of data can be read from BLAKE3 hashes; this structure lets you read those. Note that, like `hash`, this is an object which needs to be manually disposed of.

##### `reader.position: bigint`

A property which gets or sets the position of the reader in the output stream. A `RangeError` is thrown if setting this to a value less than 0 or greater than 2<sup>64</sup>-1. Note that this is a bigint, not a standard number.

```js
reader.position += 32n; // advance the reader 32 bytes
```

##### `reader.readInto(target: Uint8Array): number`

Reads bytes into the target array, filling it up and advancing the reader's position. It returns the number of bytes written, which may be less then the size of the target buffer if position 2<sup>64</sup>-1 is reached.

##### `reader.read(bytes: number): Buffer`

Reads and returns the given number of bytes from the reader, and advances the position. A `RangeError` is thrown if reading this data puts the reader past 2<sup>64</sup>-1 bytes.

##### `reader.view(target: Buffer): Readonly<Uint8Array>`

Returns a view of the given number of bytes from the reader. The view can be used synchronously, but must not be reused later. This is more efficient when using the webassembly version of the module.

Fewer bytes may be returned than requested, if the number is large (>1MB).

##### `reader[Symbol.iterator]`

The reader is an `Iterable` of `Readonly<Uint8Array>`s. Like the `view` method, the iterated arrays will be reused internally on the next iteration, so if you need data, you should copy it out of the iterated array.

### Browser

The browser API can be imported via `import('blake3/browser')`, which works well with Webpack.

Note that you **must** call the load() method before using any function in the module.

```js
import * as blake3 from 'blake3/browser-async';

blake3.load().then(() => {
  console.log(blake3.hash('hello world'));
});
```

#### `hash(data: BinaryLike, options?: { length: number }): Hash`

Returns a hash for the given data. The data can be a string, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a [Hash](#Hash) instance.

#### `keyedHash(key: BinaryLike, data: BinaryLike, options?: { length: number }): Hash`

Returns keyed a hash for the given data. The key must be exactly 32 bytes. The data can be a string, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a [Hash](#Hash) instance.

For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html).

#### `deriveKey(context: BinaryLike, material: BinaryLike, options?: { length: number }): Hash`

The key derivation function. The data can be a string, typedarray, array buffer, or array. By default, it generates the first 32 bytes of the hash for the data, but this is configurable. It returns a [Hash](#Hash) instance.

For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html).

#### `Hash`

A Hash is the type returned from hash functions and the hasher in the browser. It's a `Uint8Array` with a few additional helper methods.

##### `hash.equals(other: Uint8Array)`

Returns whether this hash equals the other hash, via a constant-time equality check.

##### `hash.toString(encoding: 'hex' | 'base64' | 'utf8'): string`

#### Hasher

The hasher is a type that lets you incrementally build a hash. For instance, you can hash a `fetch`ed page like:

```js
const res = await fetch('https://example.com');
const body = await res.body;

const hasher = blake3.createHash();
const reader = body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) {
    break;
  }

  hasher.update(value);
}

console.log('Hash of', res.url, 'is', hasher.digest('hex'));
```

Converts the hash to a string with the given encoding.

##### `createHash(): Hasher`

Creates a new hasher instance using the standard hash function.

##### `createKeyed(key: BinaryLike): Hasher`

Creates a new hasher instance for a keyed hash. For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html).

##### `createDeriveKey(context: BinaryLike): Hasher`

Creates a new hasher instance for the key derivation function. For more information, see [the blake3 docs](https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html).

##### `hasher.update(data: BinaryLike): this`

Adds data to a hash. The data can be a string, buffer, typedarray, array buffer, or array. This will throw if called after `digest()` or `dispose()`.

##### `hasher.digest(encoding?: 'hex' | 'base64' | 'utf8', options?: { length: number })): Hash | string`

Returns the hash of the data. If an `encoding` is given, a string will be returned. Otherwise, a [Hash](#hash) is returned. Optionally, you can specify the requested byte length of the hash.

##### `hasher.reader(): HashReader`

Returns a [HashReader](#HashReader) for the current hash.

##### `hasher.dispose()`

Disposes of webassembly-allocated resources. Resources are free automatically via a `FinalizationRegistry` for hashers, but you may call this manually if you run into resource-constraint issues.

#### HashReader

The hash reader can be returned from hashing functions. Up to 2<sup>64</sup>-1 bytes of data can be read from BLAKE3 hashes; this structure lets you read those. Note that, like `hash`, this is an object which needs to be manually disposed of.

##### `reader.position: bigint`

A property which gets or sets the position of the reader in the output stream. A `RangeError` is thrown if setting this to a value less than 0 or greater than 2<sup>64</sup>-1. Note that this is a bigint, not a standard number.

```js
reader.position += 32n; // advance the reader 32 bytes
```

##### `reader.readInto(target: Uint8Array): number`

Reads bytes into the target array, filling it up and advancing the reader's position. It returns the number of bytes written, which may be less then the size of the target buffer if position 2<sup>64</sup>-1 is reached.

##### `reader.read(bytes: number): Hash`

Reads and returns the given number of bytes from the reader, and advances the position. A `RangeError` is thrown if reading this data puts the reader past 2<sup>64</sup>-1 bytes.

##### `reader.view(target: Buffer): Readonly<Uint8Array>`

Returns a view of the given number of bytes from the reader. The view can be used synchronously, but must not be reused later. This is more efficient when using the webassembly version of the module.

Fewer bytes may be returned than requested, if the number is large (>1MB).

##### `reader[Symbol.iterator]`

The reader is an `Iterable` of `Readonly<Uint8Array>`s. Like the `view` method, the iterated arrays will be reused internally on the next iteration, so if you need data, you should copy it out of the iterated array.

## Speed

> Native Node.js bindings are a work in progress.

You can run benchmarks by installing `npm install -g @c4312/matcha`, then running `matcha benchmark.js`. These are the results running on Node 12 on my MacBook. Blake3 is significantly faster than Node's built-in hashing.

        276,000 ops/sec > 64B#md5 (4,240x)
        263,000 ops/sec > 64B#sha1 (4,040x)
        271,000 ops/sec > 64B#sha256 (4,160x)
      1,040,000 ops/sec > 64B#blake3 wasm (15,900x)
        625,000 ops/sec > 64B#blake3 native (9,590x)

          9,900 ops/sec > 64KB#md5 (152x)
         13,900 ops/sec > 64KB#sha1 (214x)
          6,470 ops/sec > 64KB#sha256 (99.2x)
          6,410 ops/sec > 64KB#blake3 wasm (98.4x)
         48,900 ops/sec > 64KB#blake3 native (750x)

            106 ops/sec > 6MB#md5 (1.63x)
            150 ops/sec > 6MB#sha1 (2.3x)
           69.2 ops/sec > 6MB#sha256 (1.06x)
           65.2 ops/sec > 6MB#blake3 wasm (1x)
            502 ops/sec > 6MB#blake3 native (7.7x)

## Other (JS) Implementations

- [Brooooooklyn/blake-hash](https://github.com/Brooooooklyn/blake-hash)

## Contributing

This build is a little esoteric due to the mixing of languages. We use a `Makefile` to coodinate things.

To get set up, you'll want to open the repository in VS Code. Make sure you have [Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installed, and then accept the "Reopen in Container" prompt when opening the folder. This will get the environment set up with everything you need. Then, run `make prepare` to install local dependencies.

Finally, `make` will create a build for you; you can run `make MODE=release` for a production release, and certainly should if you want to [benchmark it](#speed).

- Rust code is compiled from `src/lib.rs` to `pkg/browser` and `pkg/node`
- TypeScript code is compiled from `ts/*.ts` into `dist`

### Publishing

In case I get hit by a bus or get other contributors, these are the steps for publishing:

1.  Get all your code ready to go in master, pushed up to Github.
2.  Run `make prepare-binaries`. This will update the branch `generate-binary`, which kicks off a build via Github actions to create `.node` binaries for every relevant Node.js version.
3.  When the build completes, it'll generate a zip file of artifacts. Download those.
4.  Back on master, run `npm version <type>` to update the version in git. `git push --tags`.
5.  On Github, upload the contents of the artifacts folder to the release for the newly tagged version.
6.  Run `npm publish`.
