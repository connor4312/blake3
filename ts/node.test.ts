import { expect } from 'chai';
import { ReadableStreamBuffer } from 'stream-buffers';
import { IHashReader, maxHashBytes } from './base/hash-reader';
import { hello48, inputs, ogTestVectors } from './base/test-helpers';
import * as native from './node-native';
import * as wasm from './node-wasm';

function suite({
  hash,
  createHash,
  keyedHash,
  deriveKey,
  createDeriveKey,
  createKeyed,
}: typeof wasm | typeof native) {
  describe('encoding', () => {
    it('hashes a buffer', () => {
      expect(hash(Buffer.from(inputs.hello.input))).to.deep.equal(inputs.hello.hash);
    });

    it('hashes a string', () => {
      expect(hash(inputs.hello.input)).to.deep.equal(inputs.hello.hash);
    });

    it('hashes an arraybuffer', () => {
      const buf = Buffer.from(inputs.hello.input);
      expect(hash(new Uint8Array(buf).buffer)).to.deep.equal(inputs.hello.hash);
    });

    it('customizes the output length', () => {
      expect(hash(inputs.hello.input, { length: 16 })).to.deep.equal(
        inputs.hello.hash.slice(0, 16),
      );
    });
  });

  describe('memory-safety (#5)', () => {
    it('hash', () => {
      const hashA = hash('hello');
      const hashB = hash('goodbye');
      expect(hashA.toString('hex')).to.equal(
        'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f',
      );
      expect(hashB.toString('hex')).to.equal(
        'f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69',
      );
    });

    it('hasher', () => {
      const hasherA = createHash();
      const hasherB = createHash();
      hasherA.update('hel');
      hasherB.update('good');
      hasherA.update('lo');
      hasherB.update('bye');

      const hashA = hasherA.digest();
      const hashB = hasherB.digest();
      expect(hashA.toString('hex')).to.equal(
        'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f',
      );
      expect(hashB.toString('hex')).to.equal(
        'f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69',
      );
    });
  });

  describe('hasher', () => {
    it('digests', (callback) => {
      const buffer = new ReadableStreamBuffer();
      buffer.put(Buffer.from(inputs.large.input));
      buffer.stop();

      const hash = createHash();

      buffer.on('data', (b) => hash.update(b));
      buffer.on('end', () => {
        const actual = hash.digest();
        expect(actual).to.deep.equal(inputs.large.hash);
        callback();
      });
    });

    it('is a transform stream', (callback) => {
      const buffer = new ReadableStreamBuffer();
      buffer.put(Buffer.from(inputs.large.input));
      buffer.stop();

      buffer
        .pipe(createHash())
        .on('error', callback)
        .on('data', (hash) => {
          expect(hash).to.deep.equal(inputs.large.hash);
          callback();
        });
    });

    it('customizes the output length', () => {
      const hash = createHash();
      hash.update(inputs.hello.input);
      expect(hash.digest('hex', { length: 16 })).to.equal(
        inputs.hello.hash.slice(0, 16).toString('hex'),
      );
    });

    it('allows taking incremental hashes', () => {
      const hasher = createHash();
      hasher.update('hel');

      const hashA = hasher.digest(undefined);
      const readA = hasher.reader();

      hasher.update('lo');
      const hashB = hasher.digest(undefined);
      const readB = hasher.reader();

      const expectedA = Buffer.from(
        '3121c5bb1b9193123447ac7cfda042f67f967e7a8cf5c12e7570e25529746e4a',
        'hex',
      );
      expect(hashA).to.deep.equal(expectedA);
      expect(readA.read(32)).to.deep.equal(expectedA);

      expect(hashB).to.deep.equal(inputs.hello.hash);
      expect(readB.read(32)).to.deep.equal(inputs.hello.hash);

      hasher.dispose();
    });
  });

  describe('reader', () => {
    let reader: IHashReader<Uint8Array>;
    beforeEach(() => {
      const hash = createHash();
      hash.update(inputs.hello.input);
      reader = hash.reader();
    });

    it('implements readInto() and advances', () => {
      const actual = Buffer.alloc(32);
      reader.readInto(actual.subarray(0, 10));
      reader.readInto(actual.subarray(10));
      expect(actual).to.deep.equal(inputs.hello.hash);
      expect(reader.position).to.equal(BigInt(32));
    });

    it('implements read() and advances', () => {
      const actual = reader.read(32);
      expect(actual).to.deep.equal(inputs.hello.hash);
      expect(reader.position).to.equal(BigInt(32));

      const actualNext = reader.read(16);
      expect(actualNext).to.deep.equal(hello48.slice(32));
      expect(reader.position).to.equal(BigInt(48));
    });

    it('manually sets position', () => {
      reader.position = BigInt(32);
      const actual = reader.read(16);
      expect(actual).to.deep.equal(hello48.slice(32));
    });

    it('throws if set out of range', () => {
      expect(() => (reader.position = BigInt(-1))).to.throw(RangeError);
      expect(() => (reader.position = BigInt('18446744073709551616'))).to.throw(RangeError);

      reader.position = maxHashBytes - BigInt(1);
      expect(reader.read(2)).to.have.lengthOf(1);
      expect(reader.read(2)).to.have.lengthOf(0);
    });
  });

  describe('original test vectors', () => {
    for (const { inputLen, expectedDerive, expectedKeyed, expectedHash } of ogTestVectors.cases) {
      describe(`${inputLen}`, async () => {
        const input = Buffer.alloc(inputLen);
        for (let i = 0; i < inputLen; i++) {
          input[i] = i % 251;
        }

        it('hash()', () => {
          expect(hash(input, { length: expectedHash.length / 2 }).toString('hex')).to.equal(
            expectedHash,
          );
        });

        it('deriveKey()', () => {
          expect(
            deriveKey(ogTestVectors.context, input, { length: expectedDerive.length / 2 }).toString(
              'hex',
            ),
          ).to.equal(expectedDerive);
        });

        it('createDeriveKey()', (callback) => {
          const buffer = new ReadableStreamBuffer();
          buffer.put(Buffer.from(input));
          buffer.stop();
          const hash = createDeriveKey(ogTestVectors.context);
          buffer.on('data', (b) => hash.update(b));
          buffer.on('end', () => {
            const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
            expect(actual).to.equal(expectedDerive);
            callback();
          });
        });

        it('keyedHash()', () => {
          expect(
            keyedHash(Buffer.from(ogTestVectors.key), input, {
              length: expectedKeyed.length / 2,
            }).toString('hex'),
          ).to.equal(expectedKeyed);
        });

        it('createKeyed()', (callback) => {
          const buffer = new ReadableStreamBuffer();
          buffer.put(Buffer.from(input));
          buffer.stop();
          const hash = createKeyed(Buffer.from(ogTestVectors.key));
          buffer.on('data', (b) => hash.update(b));
          buffer.on('end', () => {
            const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
            expect(actual).to.equal(expectedKeyed);
            callback();
          });
        });
      });
    }
  });
}

describe('node.js wasm', () => {
  before(async () => {
    await wasm.load();
  });
  suite(wasm);
});
describe('node.js native', () => suite(native));
