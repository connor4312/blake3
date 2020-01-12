import { readFileSync } from 'fs';

export const inputs = {
  large: {
    input: readFileSync(__dirname + '/../../test-input.txt', 'utf-8'),
    hash: '2a2cf9cbc9f8d48f7d089273bc2d796a3cd0677b64234dab0c59e6e29d6a7164',
  },
  hello: {
    input: 'hello',
    hash: 'ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f',
  },
  goodbye: {
    input: 'goodbye',
    hash: 'f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69',
  },
};
