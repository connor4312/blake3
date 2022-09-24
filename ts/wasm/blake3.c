#include <blake3.h>
#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>

void EMSCRIPTEN_KEEPALIVE hash_oneshot(const void *input, size_t input_len,
                                       void *out, size_t out_len) {
  blake3_hasher h;
  blake3_hasher_init(&h);
  blake3_hasher_update(&h, input, input_len);
  blake3_hasher_finalize_seek(&h, 0, out, out_len);
}

blake3_hasher *EMSCRIPTEN_KEEPALIVE clone_hasher(blake3_hasher *h) {
  blake3_hasher *h2 = malloc(sizeof(blake3_hasher));
  *h2 = *h;
  return h2;
}

blake3_hasher *EMSCRIPTEN_KEEPALIVE hasher_init(int x) {
  blake3_hasher *h = malloc(sizeof(blake3_hasher));
  blake3_hasher_init(h);
  return h;
}

blake3_hasher *EMSCRIPTEN_KEEPALIVE hasher_init_keyed(const uint8_t *key) {
  blake3_hasher *h = malloc(sizeof(blake3_hasher));
  blake3_hasher_init_keyed(h, key);
  return h;
}

blake3_hasher *EMSCRIPTEN_KEEPALIVE hasher_init_derive(const void *context,
                                                       size_t context_len) {
  blake3_hasher *h = malloc(sizeof(blake3_hasher));
  blake3_hasher_init_derive_key_raw(h, context, context_len);
  return h;
}

void EMSCRIPTEN_KEEPALIVE hasher_update(blake3_hasher *h, const void *input,
                                        size_t input_len) {
  blake3_hasher_update(h, input, input_len);
}

void EMSCRIPTEN_KEEPALIVE hasher_read(blake3_hasher *h, uint32_t seek0,
                                      uint32_t seek1, void *out,
                                      size_t out_len) {
  // Bigint support in wasm is still experimental in supported Node.js versions.
  // https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-pass-int64-t-and-uint64-t-values-from-js-into-wasm-functions
  uint64_t seek = (uint64_t)seek0 << 32 | (uint64_t)seek1;
  blake3_hasher_finalize_seek(h, seek, out, out_len);
}
