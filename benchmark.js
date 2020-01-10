const { hash } = require('.');
const { readFileSync } = require('fs');
const { createHash } = require('crypto');

const testInput = readFileSync(__dirname + '/test-input.txt');

bench('md5', () => createHash('md5').update(testInput).digest())
bench('blake3', () => hash(testInput))
