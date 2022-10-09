TARGETS=nodejs browser web
MODE=dev

BLAKE3_SRC = blake3-src/c/blake3.c blake3-src/c/blake3_dispatch.c blake3-src/c/blake3_portable.c blake3-src/c/blake3_sse41.c

EM_WASM_SRC = blake3-wasm/src/wasm/blake3.c $(BLAKE3_SRC)
EM_WASM_OUT = blake3-wasm/dist/wasm/blake3.js blake3-wasm/esm/wasm/blake3.mjs

BINDING_CONFIG = blake3-native/build/Makefile
BINDING_SRC = $(wildcard blake3-native/src/*.cc) $(BLAKE3_SRC) $(BINDING_CONFIG)
BINDING_SRC_CP = blake3-native/c
BINDING_OUT = blake3-native/build/Release/blake3.node

TS_INTERNAL_SRC = $(wildcard blake3-internal/src/*.ts)
TS_INTERNAL_OUT = blake3-internal/dist/index.js

TS_WASM_SRC = $(wildcard blake3-wasm/src/*.ts) $(TS_INTERNAL_OUT)
TS_WASM_OUT = blake3-wasm/dist/browser/index.js

TS_NATIVE_SRC = $(wildcard blake3-native/src/*.ts) $(TS_INTERNAL_OUT)
TS_NATIVE_OUT = blake3-native/dist/index.js

TS_ROOT_SRC = $(wildcard blake3/*.cts) $(wildcard blake3/*.mts) $(TS_WASM_OUT) $(TS_NATIVE_OUT)
TS_ROOT_OUT = blake3/index.cjs

ALL_OUT = $(EM_WASM_OUT) $(BINDING_OUT) $(TS_ROOT_OUT)

define wasm-compile =
emcc -O3 -msimd128 -msse4.1 $^ -o $@ \
		-sEXPORTED_FUNCTIONS=_malloc,_free -sEXPORTED_RUNTIME_METHODS=ccall -Iblake3-src/c -sMODULARIZE -s 'EXPORT_NAME="createMyModule"' \
		-sASSERTIONS=0 --profiling \
		-DIS_WASM -DBLAKE3_NO_AVX512 -DBLAKE3_NO_SSE2 -DBLAKE3_NO_AVX2
endef

all: $(ALL_OUT)

blake3-wasm/dist/wasm/blake3.js: $(EM_WASM_SRC)
	mkdir -p $(dir $@)
	$(wasm-compile)

blake3-wasm/esm/wasm/blake3.mjs: $(EM_WASM_SRC)
	mkdir -p $(dir $@)
	$(wasm-compile)

$(BINDING_CONFIG):
	cd blake3-native && node-gyp configure

$(BINDING_SRC_CP): $(BINDING_SRC)
	cp -R blake3-src/c blake3-native

$(BINDING_OUT): $(BINDING_SRC_CP)
	cd blake3-native && node-gyp build

$(TS_INTERNAL_OUT): $(TS_INTERNAL_SRC)
	cd blake3-internal && ../node_modules/.bin/tsc -p tsconfig.json
	cd blake3-internal && ../node_modules/.bin/tsc -p tsconfig.esm.json

$(TS_WASM_OUT): $(TS_WASM_SRC)
	cd blake3-wasm && ../node_modules/.bin/tsc -p tsconfig.json
	cd blake3-wasm && ../node_modules/.bin/tsc -p tsconfig.esm.json

$(TS_NATIVE_OUT): $(TS_NATIVE_SRC)
	cd blake3-native && ../node_modules/.bin/tsc -p tsconfig.json
	cd blake3-native && ../node_modules/.bin/tsc -p tsconfig.esm.json

$(TS_ROOT_OUT): $(TS_ROOT_SRC)
	cd blake3 && ../node_modules/.bin/tsc -p tsconfig.json
	cd blake3 && ../node_modules/.bin/tsc -p tsconfig.esm.json

test: $(ALL_OUT)
	cd blake3 && node ../node_modules/.bin/mocha "*.test.cjs" --timeout 5000 $(TEST_ARGS)

clean:
	rm -rf ./*/build ./*/dist ./*/esm

fmt:
	node ./node_modules/.bin/remark readme.md -f -o readme.md
	node ./node_modules/.bin/prettier --write "ts/**/*.ts" "*.md"

pack:
	npm pack -w blake3 -w blake3-native -w blake3-internal -w blake3-wasm

.PHONY: all clean test fmt get-native pack
