import { readFileSync, writeFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { get } from 'https';

const builtVersions = ['10', '11', '12', '13'];
const builtPlatforms: { [K in NodeJS.Platform]?: string } = {
  win32: 'windows-latest',
  linux: 'linux-latest',
  darwin: 'macos-latest',
};

const { version } = require('../package.json');
const repoUrl = 'https://github.com/connor4312/blake3';
const issueUrl = `${repoUrl}/issues/new`;

async function install() {
  const [, majorVersion] = /^v([0-9]+)/.exec(process.version) || [];
  if (Number(majorVersion) < Number(builtVersions[0])) {
    console.error(
      'Your Node.js release is out of LTS and BLAKE3 bindings are not built for it. Update it to use native BLAKE3 bindings.',
    );
    return fallback();
  }

  if (!builtVersions.includes(majorVersion)) {
    console.error(
      `BLAKE3 native not built for your Node.js version, please open an issue! ${issueUrl}`,
    );
    return fallback();
  }

  const platform = builtPlatforms[process.platform];
  if (!platform) {
    console.error(`BLAKE3 bindings are not built for your platform (${process.platform})`);
    return fallback();
  }

  console.log(
    `Retrieving native BLAKE3 bindings for Node v${majorVersion} on ${process.platform}...`,
  );
  await download(`${repoUrl}/releases/download/v${version}/${platform}-${majorVersion}.node`);
  useNativeImport();
  console.log('BLAKE3 bindings retrieved');
}

function fallback() {
  console.error('BLAKE3 will use slower WebAssembly bindings when required in Node.js');
}

async function download(url: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const onError = (err: Error) => {
      console.error(`Could not download binding from ${url}: ${err.stack || err.message}`);
      resolve(false);
    };

    const req = get(url, res => {
      pipeline(res, createWriteStream(join(__dirname, 'native.node')), err =>
        err ? onError(err) : resolve(true),
      );
    });

    req.on('error', onError);
  });
}

function useNativeImport() {
  const indexFile = join(__dirname, 'index.js');
  const contents = readFileSync(indexFile, 'utf-8');
  writeFileSync(indexFile, contents.replace('./node', './node-native'));
}

install().catch(fallback);
