// A small collection of encodings for convenience of use in the browser.

export type BrowserEncoding = 'hex' | 'base64' | 'utf8';

const decoder = new TextDecoder();

const encoders: { [K in BrowserEncoding]: (data: Uint8Array) => string } = {
  // certainly not the fastest, but hashes are pretty small
  base64: (data) => btoa(String.fromCharCode(...data)),

  hex: (data) => {
    let out = '';
    for (const byte of data) {
      if (byte < 0x10) {
        out += '0';
      }

      out += byte.toString(16);
    }

    return out;
  },

  utf8: (data) => decoder.decode(data),
};

/**
 * @hidden
 */
export const mustGetEncoder = (encoding: BrowserEncoding) => {
  const encoder = encoders[encoding];
  if (!encoder) {
    throw new Error(`Unknown encoding ${encoding}`);
  }

  return encoder;
};
