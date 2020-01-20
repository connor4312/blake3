import native from './native';
import { NodeHash } from '../node/hash-instance';
import { NodeHashReader } from '../node/hash-reader';

// A buffer we reuse for sending bigints. set_position is synchronous, so
// this just saves creating garbage.
const bigIntBuffer = Buffer.alloc(8);

/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () =>
  new NodeHash(
    new native.Hasher(),
    r =>
      new NodeHashReader({
        fill: target => r.fill(target),
        set_position: position => {
          bigIntBuffer.writeBigUInt64BE(position);
          r.set_position(bigIntBuffer);
        },
      }),
  );
