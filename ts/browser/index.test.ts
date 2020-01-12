import webpack from 'webpack';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import handler from 'serve-handler';
import puppeteer from 'puppeteer';
import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import { inputs } from '../base/test-helpers';
import { tmpdir } from 'os';
import { expect } from 'chai';

describe('browser', () => {
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
          mode: 'development',
          entry: resolve(testDir, 'entry-src.js'),
          output: {
            path: testDir,
            filename: 'main.js',
          },
          resolve: {
            alias: {
              'blake3/browser': resolve(__dirname, '../../', 'browser.js'),
            },
          },
        },
        (err, stats) => (err ? rej(err) : res(stats)),
      ),
    );

    if (stats.hasErrors()) {
      throw stats.toString('errors-only');
    }

    writeFileSync(
      resolve(testDir, 'index.html'),
      `
      <script src="/main.js"></script>
      <script>window.inputs = ${JSON.stringify(inputs)}</script>
    `,
    );
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
  });

  it('hashes a string', async () => {
    const result = await page.evaluate('blake3.hash(inputs.large.input, "hex")');
    expect(result).to.equal(inputs.large.hash);
  });

  after(() => {
    page?.browser().close();
    server?.close();
  });
});
