import * as fs from 'fs';

const files = ['index.cjs', 'index.d.cts', 'index.mjs', 'index.d.mts'];
const nativeModule = '@c4312/blake3-native';
const wasmModule = 'blake3-wasm';

let targetModule: string;
try {
  require(nativeModule);
  targetModule = nativeModule;
} catch {
  targetModule = wasmModule;
}

for (const file of files) {
  const path = `${__dirname}/${file}`;
  const content = fs
    .readFileSync(path, 'utf-8')
    .replaceAll(nativeModule, targetModule)
    .replaceAll(wasmModule, targetModule);

  fs.writeFileSync(path, content);
}
