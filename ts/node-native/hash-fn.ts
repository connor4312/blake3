import native from './native';
import { HashInput } from '../node/hash-fn';
import { IBaseHashOptions, defaultHashLength } from '../base/hash-fn';

/**
 * @hidden
 */
export const normalizeInput = (input: HashInput, encoding?: BufferEncoding): Buffer => {
  if (input instanceof Buffer) {
    return input;
  }

  if (typeof input === 'string') {
    return Buffer.from(input, encoding);
  }

  return Buffer.from(input as Uint8Array);
};

/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(input: HashInput, options?: IBaseHashOptions): Buffer;

/**
 * Returns a blake3 hash of the input, returning the hash encoding with the
 * requested encoding.
 */
export function hash(
  input: HashInput,
  options: IBaseHashOptions & { encoding: BufferEncoding },
): string;

export function hash(
  input: HashInput,
  { encoding, length = defaultHashLength }: IBaseHashOptions & { encoding?: BufferEncoding } = {},
): Buffer | string {
  const result = native.hash(normalizeInput(input), length);
  return encoding ? result.toString(encoding) : result;
}