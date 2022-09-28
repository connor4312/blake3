TARGETS=nodejs browser web
MODE=dev

BLAKE3_SRC = BLAKE3/c/blake3.c BLAKE3/c/blake3_dispatch.c BLAKE3/c/blake3_portable.c BLAKE3/c/blake3_sse41.c

EM_WASM_SRC = ts/wasm/blake3.c $(BLAKE3_SRC)
EM_WASM_OUT = dist/wasm/cjs/blake3.js dist/wasm/esm/blake3.mjs

BINDING_CONFIG = build/Makefile
BINDING_SRC = $(wildcard ts/node-native/*.cc) $(BLAKE3_SRC) $(BINDING_CONFIG)
BINDING_OUT = build/Release/blake3.node

TS_SRC = $(wildcard ts/*.ts) $(wildcard ts/*/*.ts)
TS_OUT = dist/index.js esm/index.js

ALL_OUT = $(EM_WASM_OUT) $(TS_OUT) $(BINDING_OUT)

define wasm-compile =
emcc -O3 -msimd128 -msse4.1 $^ -o $@ \
		-sEXPORTED_FUNCTIONS=_malloc,_free -sEXPORTED_RUNTIME_METHODS=ccall -IBLAKE3/c -sMODULARIZE -s 'EXPORT_NAME="createMyModule"' \
		-sASSERTIONS=0 --profiling \
		-DIS_WASM -DBLAKE3_NO_AVX512 -DBLAKE3_NO_SSE2 -DBLAKE3_NO_AVX2
endef

all: $(ALL_OUT)

dist/wasm/cjs/blake3.js: $(EM_WASM_SRC)
	mkdir -p $(dir $@)
	$(wasm-compile)

dist/wasm/esm/blake3.mjs: $(EM_WASM_SRC)
	mkdir -p $(dir $@)
	$(wasm-compile)

$(BINDING_CONFIG):
	node-gyp configure

$(BINDING_OUT): $(BINDING_SRC)
	node-gyp build

$(TS_OUT): $(TS_SRC)
	./node_modules/.bin/tsc -p tsconfig.json
	./node_modules/.bin/tsc -p tsconfig.esm.json

test: $(ALL_OUT)
	node ./node_modules/.bin/mocha --require source-map-support/register --recursive "dist/**/*.test.js" --timeout 5000 $(TEST_ARGS)

clean:
	rm -rf build dist esm

fmt:
	node ./node_modules/.bin/remark readme.md -f -o readme.md
	node ./node_modules/.bin/prettier --write "ts/**/*.ts" "*.md"

.PHONY: all clean test fmt
