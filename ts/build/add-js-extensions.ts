import * as ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { extname, basename, join, resolve } from 'path';

/**
 * Script that adds .js extension to imports so that it's compatible with plain
 * browser/non-webpack bundlers. TS doesn't support this natively yet.
 * @see https://github.com/microsoft/TypeScript/issues/16577
 */

function processFile(file: string) {
  let source = readFileSync(file, 'utf-8');
  const program = ts.createSourceFile(basename(file), source, ts.ScriptTarget.ES2015, true);

  let offset = 0;
  const process = (node: ts.Node): void => {
    if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier) {
      return ts.forEachChild(node, process);
    }

    const specifier = node.moduleSpecifier;
    if (extname(specifier.getText()) === '') {
      const idx = specifier.end + offset - 1;
      source = source.slice(0, idx) + '.js' + source.slice(idx);
      offset += 3;
    }
  };

  process(program);

  writeFileSync(file, source);
}

function processDir(dir: string): void {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = join(dir, entry);
    if (path.endsWith('.js')) {
      processFile(path);
    } else if (statSync(path).isDirectory()) {
      processDir(path);
    }
  }
}

processDir(resolve(__dirname, '..', '..', 'esm'));
