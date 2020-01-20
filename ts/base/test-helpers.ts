import { readFileSync } from 'fs';

export const hello48 = Buffer.from(
  'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200fe992405f0d785b599a2e3387f6d34d01',
  'hex',
);

export const inputs = {
  large: {
    input: readFileSync(__dirname + '/../../test-input.txt', 'utf-8'),
    hash: Buffer.from('2a2cf9cbc9f8d48f7d089273bc2d796a3cd0677b64234dab0c59e6e29d6a7164', 'hex'),
  },
  hello: {
    input: 'hello',
    hash: Buffer.from('ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f', 'hex'),
  },
  goodbye: {
    input: 'goodbye',
    hash: Buffer.from('f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69', 'hex'),
  },
};
