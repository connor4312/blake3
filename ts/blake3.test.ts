import { hash, createHash } from './node';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import { ReadableStreamBuffer } from 'stream-buffers';

const testInput = readFileSync(__dirname + '/../test-input.txt');
const expected = '2a2cf9cbc9f8d48f7d089273bc2d796a3cd0677b64234dab0c59e6e29d6a7164';

const toHex = (arr: Uint8Array) => Buffer.from(arr).toString('hex');

it('hashes a string', () => {
  expect(toHex(hash(testInput))).to.equal(expected);
});

describe('encoding', () => {
  it('hashes a buffer', () => {
    expect(toHex(hash(testInput))).to.equal(expected);
  });

  it('hashes a string', () => {
    expect(toHex(hash(testInput.toString('utf-8')))).to.equal(expected);
  });

  it('hashes an arraybuffer', () => {
    expect(toHex(hash(testInput.buffer))).to.equal(expected);
  });
});

describe('hash class', () => {
  it('digests', () => {
    const buffer = new ReadableStreamBuffer();
    buffer.put(testInput);
    buffer.stop();

    const hash = createHash();

    buffer.on('data', b => hash.update(b));
    buffer.on('end', () => {
      const actual = hash.digest();
      expect(toHex(actual)).to.equal(expected);
    });
  });
});
