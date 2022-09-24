const { hash: hashWasm, load } = require('./dist/node-wasm');
const { hash: hashNative } = require('./dist/node-native');
const { createHash } = require('crypto');
const b = require('benny');

(async () => {
  await load();


  [
    { size: '64B', data: Buffer.alloc(64) },
    { size: '64KB', data: Buffer.alloc(1024 * 64) },
    { size: '6MB', data: Buffer.alloc(1024 * 1024 * 6) },
  ].forEach(({ size, data }) =>
    b.suite(
      size,
      b.add('blake3 wasm', () => hashWasm(data)),
      b.add('blake3 native', () => hashNative(data)),
      ...['md5', 'sha1', 'sha256'].map((alg) =>
        b.add(alg, () => createHash(alg).update(data).digest()),
      ),
      b.cycle(),
    ),
  );
})();
