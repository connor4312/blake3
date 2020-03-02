# Changelog

## 2.1.2 - 2019-03-01

- fix missing createKeyed function in browsers

## 2.1.1 - 2019-02-11

- allow importing the module without a bundler or with tools like Parcel

## 2.1.0 - 2019-01-23

- add keyed hash and key derivation support (fixes [#2](https://github.com/connor4312/blake3/issues/2), [#9](https://github.com/connor4312/blake3/issues/9))
- fixed a bug in hex encoding in the browser

## 2.0.1 - 2019-01-23

- fix browser bundle to use pure es modules (fixes [#8](https://github.com/connor4312/blake3/issues/8))

## 2.0.0 - 2019-01-19

- **breaking** the simple `hash` function no longer takes an encoding in its second parameter. Use `hash(data).toString(<encoding>)` instead.
- allow configuring the hash length in `hash()` and `hasher.digest()`
- add `using()` helper to deal with disposables
- add `dispose: boolean` option to Hashers' `.digest()` methods, so that you can read a head while continuing to update it
- add `hasher.reader()` method to retrieve a hash reader object, which allows seeking through and reading arbitrary amounts of data from the hash
- add helper methods for encoding and constant-time equality checking in the returned Hash within the browser

## 1.2.0 - 2019-01-14

- add native Node.js bindings

## 1.2.0-0 - 2019-01-14 (prerelease)

- add native Node.js bindings

## 1.1.0 - 2019-01-12

- add support for usage in browsers
- fix potential memory unsafety in WebAssembly land
- add support for output encoding in `Hash.digest([encoding])`

## 1.0.0 - 2019-01-09

Initial release
