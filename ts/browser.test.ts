import webpack from 'webpack';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import handler from 'serve-handler';
import puppeteer, { Page } from 'puppeteer';
import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import { inputs, hello48, ogTestVectors } from './base/test-helpers';
import { tmpdir } from 'os';
import { expect } from 'chai';

// Much of the browser code is also used in Node's wasm. We test things more
// thoroughly there because tests are easier to write and debug, these tests
// are primarily for sanity and checking browser-specific behavior.
describe('browser', () => {
  const addInputs = `window.inputs = ${JSON.stringify(inputs)}`;

  describe('webpack', () => {
    const testDir = resolve(tmpdir(), 'blake3-browser-test');
    let server: Server;
    let page: puppeteer.Page;

    /**
     * Builds the browser lib into the testDir.
     */
    async function buildWebpack() {
      try {
        mkdirSync(testDir);
      } catch {
        // already exists, probably
      }

      writeFileSync(
        resolve(testDir, 'entry-src.js'),
        `import("blake3/browser").then(b3 => window.blake3 = b3);`,
      );

      const stats = await new Promise<webpack.Stats>((res, rej) =>
        webpack(
          {
            mode: 'production',
            devtool: 'source-map',
            entry: resolve(testDir, 'entry-src.js'),
            output: {
              path: testDir,
              filename: 'main.js',
            },
            resolve: {
              alias: {
                'blake3/browser': resolve(__dirname, '../', 'browser.js'),
              },
            },
          },
          (err, stats) => (err ? rej(err) : res(stats)),
        ),
      );

      if (stats.hasErrors()) {
        throw stats.toString('errors-only');
      }

      writeFileSync(resolve(testDir, 'index.html'), `<script src="/main.js"></script>`);
    }

    async function serve() {
      server = createServer((req, res) => handler(req, res, { public: testDir }));
      await new Promise(resolve => server.listen(0, resolve));
    }

    before(async function() {
      await buildWebpack();
      await serve();

      this.timeout(20 * 1000);

      const { port } = server.address() as AddressInfo;
      const browser = await puppeteer.launch();
      page = await browser.newPage();
      await page.goto(`http://localhost:${port}`);
      await page.waitForFunction('!!window.blake3');
      await page.evaluate(addInputs);
    });

    runTests({
      get page() {
        return page;
      },
    });

    after(() => {
      page?.browser().close();
      server?.close();
    });
  });

  describe('native browser', () => {
    let server: Server;
    let page: puppeteer.Page;

    async function serve() {
      server = createServer((req, res) => handler(req, res, { public: resolve(__dirname, '..') }));
      await new Promise(resolve => server.listen(0, resolve));
    }

    before(async function() {
      await serve();

      this.timeout(20 * 1000);

      const { port } = server.address() as AddressInfo;
      const browser = await puppeteer.launch();
      page = await browser.newPage();
      page.on('console', console.log);
      page.on('pageerror', console.log);
      page.on('error', console.log);
      await page.goto(`http://localhost:${port}/browser-async.test.html`);
      await page.waitForFunction('!!window.blake3');
      await page.evaluate(addInputs);
    });

    runTests({
      get page() {
        return page;
      },
    });

    after(() => {
      page?.browser().close();
      server.close();
    });
  });
});

function runTests(opts: { page: Page }) {
  it('hashes a string', async () => {
    const result = await opts.page.evaluate('blake3.hash(inputs.large.input).toString("hex")');
    expect(result).to.equal(inputs.large.hash.toString('hex'));
  });

  describe('input encoding', () => {
    it('hashes a uint8array', async () => {
      const contents = [...new Uint8Array(Buffer.from(inputs.hello.input))];
      const result = await opts.page.evaluate(
        `blake3.hash(new Uint8Array([${contents.join(',')}])).toString("hex")`,
      );
      expect(result).to.equal(inputs.hello.hash.toString('hex'));
    });

    it('hashes a string', async () => {
      const result = await opts.page.evaluate('blake3.hash(inputs.large.input).toString("hex")');
      expect(result).to.equal(inputs.large.hash.toString('hex'));
    });

    it('customizes output length', async () => {
      const result = await opts.page.evaluate(
        'blake3.hash(inputs.hello.input, { length: 16 }).toString("hex")',
      );
      expect(result).to.equal(inputs.hello.hash.slice(0, 16).toString('hex'));
    });
  });

  describe('output encoding', () => {
    const tcases = [
      { encoding: 'hex', expected: inputs.hello.hash.toString('hex') },
      { encoding: 'base64', expected: inputs.hello.hash.toString('base64') },
      { encoding: 'utf8', expected: inputs.hello.hash.toString('utf8') },
    ];

    tcases.forEach(({ encoding, expected }) =>
      it(encoding, async () => {
        const result = await opts.page.evaluate(
          `blake3.hash(inputs.hello.input).toString("${encoding}")`,
        );
        expect(result).to.equal(expected);
      }),
    );

    it('raw', async () => {
      const result = (await opts.page.evaluate(`blake3.hash(inputs.hello.input)`)) as {
        length: number;
        [n: number]: number;
      };
      const actual = Buffer.alloc(32);
      for (let i = 0; i < actual.length; i++) {
        actual[i] = result[i]; // it comes as a plain object, we need to convert it to a buffer
      }
      expect(actual).to.deep.equal(inputs.hello.hash);
    });
  });

  describe('hash class', () => {
    it('digests', async () => {
      const result = await opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        ${[...Buffer.from(inputs.hello.input)]
          .map(byte => `hash.update(new Uint8Array([${byte}]));`)
          .join('\n')}
        return hash.digest('hex');
      })()`);

      expect(result).to.equal(inputs.hello.hash.toString('hex'));
    });

    it('customizes the output length', async () => {
      const result = await opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        hash.update(${JSON.stringify(inputs.hello.input)});
        return hash.digest('hex', { length: 16 });
      })()`);

      expect(result).to.equal(inputs.hello.hash.slice(0, 16).toString('hex'));
    });

    it('returns a hash instance from digest', async () => {
      const result = await opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        ${[...Buffer.from(inputs.hello.input)]
          .map(byte => `hash.update(new Uint8Array([${byte}]));`)
          .join('\n')}
        return hash.digest('hex');
      })()`);

      expect(result).to.equal(inputs.hello.hash.toString('hex'));
    });
  });

  describe('reader', () => {
    it('is sane with a Hash', async () => {
      const result = await opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        hash.update("hello");

        return blake3.using(hash.reader(), reader => [
          reader.read(48).toString('hex'),
          reader.toArray().toString('hex'),
          reader.toString('hex'),
        ]);
      })()`);

      expect(result).to.deep.equal([
        hello48.toString('hex'),
        inputs.hello.hash.toString('hex'),
        inputs.hello.hash.toString('hex'),
      ]);
    });
  });

  describe('original test vectors', () => {
    for (const {
      inputLen,
      expectedDerive,
      expectedHash,
      expectedKeyed,
    } of ogTestVectors.cases.slice(0, 6)) {
      describe(`${inputLen}`, async () => {
        const input = Buffer.alloc(inputLen);
        for (let i = 0; i < inputLen; i++) {
          input[i] = i % 251;
        }

        const inputStr = `new Uint8Array([${input.join(',')}])`;

        it('hash()', async () => {
          const result = await opts.page.evaluate(`blake3.hash(
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);

          expect(result).to.equal(expectedHash);
        });

        it('deriveKey()', async () => {
          const result = await opts.page.evaluate(`blake3.deriveKey(
            ${JSON.stringify(ogTestVectors.context)},
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);

          expect(result).to.equal(expectedDerive);
        });

        it('createKeyed()', async () => {
          const result = await opts.page.evaluate(`(() => {
            const hasher = blake3.createKeyed(new Uint8Array([${Buffer.from(ogTestVectors.key).join(
              ',',
            )}]));
            hasher.update(${inputStr});
            return hasher.digest({ length: ${expectedHash.length / 2} }).toString('hex');
          })()`);

          expect(result).to.equal(expectedKeyed);
        });

        it('keyedHash()', async () => {
          const result = await opts.page.evaluate(`blake3.keyedHash(
            new Uint8Array([${Buffer.from(ogTestVectors.key).join(',')}]),
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);

          expect(result).to.equal(expectedKeyed);
        });
      });
    }
  });
}
