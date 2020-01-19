import native from './native';
import { NodeHash } from '../node/hash-instance';

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NodeHash(new native.Hasher());
