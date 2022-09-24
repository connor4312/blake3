const { hash: hashWasm, load } = require('./');
// const { hash: hashNative } = require('./dist/node-native');
const { createHash } = require('crypto');
const b = require('benny');

const empty = Buffer.alloc(1024);

(async () => {
  await load();
  console.log('start');

  while (true) {
    hashWasm(empty);
  }
})();
