# Changelog

## 3.0.0 - 2022-10-08

- **breaking:** Node 16, or a modern browser, is required
- **breaking:**   native module is now built post-download with node-gyp, removing most build headaches and allowing architecture-specific optimizations. You do therefore need [node-gyp dependencies](https://github.com/nodejs/node-gyp#installation) to use the native module. (However, it automatically falls back to wasm if node-gyp building fails)
- **breaking**: _all_ consumers must await `blake3.load()` before using hash functions
- calling `dispose()` on hash instances is now optional
- blake3 now uses SIMD operations both for native hashing and in WebAssembly

## 2.1.7 - 2021-11-10

- fix publishing failure in 2.1.6

## 2.1.6 - 2021-11-10

- build for node 16

## 2.1.5 - 2020-11-28

- fix version matching on postinstall
- build for node 15

## 2.1.4 - 2020-05-11

- add support for Node 14
- validate native bindings before switching to them

## 2.1.3 - 2020-03-06

- update to BLAKE3@0.2, providing significant speed improvements for native Node
- fixed missing file causing installation of native Node extensions to fail

## 2.1.2 - 2020-03-01

- fix missing createKeyed function in browsers

## 2.1.1 - 2020-02-11

- allow importing the module without a bundler or with tools like Parcel

## 2.1.0 - 2020-01-23

- add keyed hash and key derivation support (fixes [#2](https://github.com/connor4312/blake3/issues/2), [#9](https://github.com/connor4312/blake3/issues/9))
- fixed a bug in hex encoding in the browser

## 2.0.1 - 2020-01-23

- fix browser bundle to use pure es modules (fixes [#8](https://github.com/connor4312/blake3/issues/8))

## 2.0.0 - 2020-01-19

- **breaking** the simple `hash` function no longer takes an encoding in its second parameter. Use `hash(data).toString(<encoding>)` instead.
- allow configuring the hash length in `hash()` and `hasher.digest()`
- add `using()` helper to deal with disposables
- add `dispose: boolean` option to Hashers' `.digest()` methods, so that you can read a head while continuing to update it
- add `hasher.reader()` method to retrieve a hash reader object, which allows seeking through and reading arbitrary amounts of data from the hash
- add helper methods for encoding and constant-time equality checking in the returned Hash within the browser

## 1.2.0 - 2020-01-14

- add native Node.js bindings

## 1.2.0-0 - 2020-01-14 (prerelease)

- add native Node.js bindings

## 1.1.0 - 2020-01-12

- add support for usage in browsers
- fix potential memory unsafety in WebAssembly land
- add support for output encoding in `Hash.digest([encoding])`

## 1.0.0 - 2020-01-09

Initial release
