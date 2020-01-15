const { hash } = require('blake3');
const { createHash } = require('crypto');

[
  { size: '64B', data: Buffer.alloc(64) },
  { size: '64KB', data: Buffer.alloc(1024 * 64) },
  { size: '6MB', data: Buffer.alloc(1024 * 1024 * 6) },
].forEach(({ size, data }) =>
  suite(size, () => {
    ['md5', 'sha1', 'sha256'].forEach(alg =>
      bench(alg, () =>
        createHash(alg)
          .update(data)
          .digest(),
      ),
    );

    bench('blake3', () => hash(data));
  }),
);
