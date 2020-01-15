import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { dump } from 'js-yaml';

const minVersion = 64;

(async () => {
  const res = await fetch('https://nodejs.org/dist/index.json');
  if (!res.ok) {
    throw new Error(`${res.status} error from Node.js releases page`);
  }

  const releases: { version: string; modules: string }[] = await res.json();
  const buildVersion = new Map<number, string>();
  const versionMap: { [key: string]: number } = {};
  for (const release of releases) {
    const moduleVersion = Number(release.modules);
    if (!moduleVersion || moduleVersion < minVersion) {
      break;
    }

    versionMap[release.version] = Number(moduleVersion);
    if (buildVersion.has(moduleVersion)) {
      continue;
    }

    buildVersion.set(moduleVersion, release.version);
  }

  const buildYaml = {
    name: 'Generate Binaries',
    on: {
      push: {
        branches: ['generate-binary'],
      },
    },
    jobs: {
      build: {
        name: 'Build',
        'runs-on': '${{ matrix.os }}',
        strategy: {
          matrix: { os: ['macos-latest', 'ubuntu-latest', 'windows-latest'] },
        },
        steps: [
          { uses: 'actions/checkout@master' },
          { run: 'mkdir dist' },
          {
            uses: 'actions-rs/toolchain@v1',
            with: { target: 'wasm32-unknown-unknown', toolchain: 'nightly' },
          },
          ...[...buildVersion.entries()]
            .map(([moduleVersion, nodeVersion], i) => [
              { uses: 'actions/setup-node@v1', with: { 'node-version': nodeVersion } },
              ...(i === 0
                ? [{ run: 'npm install neon-cli rimraf' }]
                : [
                    {
                      // See: https://github.com/actions/setup-node/issues/68
                      shell: 'powershell',
                      name: 'patch node-gyp for VS 2019',
                      run:
                        'npm install --global node-gyp@latest\r\nnpm prefix -g | % {npm config set node_gyp "$_\\node_modules\\node-gyp\\bin\\node-gyp.js"}',
                      if: "matrix.os == 'windows-latest'",
                    },
                    { run: './node_modules/.bin/rimraf rs/native/target' },
                  ]),
              { run: '../node_modules/.bin/neon build --release', 'working-directory': 'rs' },
              { run: `mv rs/native/index.node dist/\${{ matrix.os }}-${moduleVersion}.node` },
            ])
            .reduce((acc, v) => [...acc, ...v], []),
          {
            uses: 'actions/upload-artifact@v1',
            with: { name: 'dist', path: 'dist' },
          },
        ],
      },
    },
  };

  writeFileSync(
    join(__dirname, '..', '..', '.github', 'workflows', 'build-neon.yml'),
    dump(buildYaml),
  );
  writeFileSync(join(__dirname, '..', '..', 'targets.json'), JSON.stringify(versionMap));
})();
