# Changelog

## 2.0.0 - TBA

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
