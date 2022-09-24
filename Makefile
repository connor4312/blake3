TARGETS=nodejs browser web
MODE=dev

EM_WASM_SRC = ts/wasm/blake3.c BLAKE3/c/blake3.c BLAKE3/c/blake3_dispatch.c BLAKE3/c/blake3_portable.c BLAKE3/c/blake3_sse41.c
EM_WASM_OUT = dist/wasm/cjs/blake3.js dist/wasm/esm/blake3.mjs

RUST_WASM_SRC = $(wildcard rs/wasm/src/*.rs)
RUST_WASM_OUT = $(patsubst %, dist/wasm/%/blake3_js_bg.wasm, $(TARGETS))
RUST_NATIVE_SRC = $(wildcard rs/native/src/*.rs)
RUST_NATIVE_OUT = dist/native.node
TS_SRC = $(wildcard ts/*.ts)
TS_OUT = dist/index.js esm/index.js

dist/wasm/%: $(EM_WASM_SRC)
	mkdir -p $(dir $@)
	emcc -O3 -msimd128 -msse4.1 $^ -o $@ \
		-sEXPORTED_FUNCTIONS=_malloc,_free -sEXPORTED_RUNTIME_METHODS=ccall -IBLAKE3/c -sMODULARIZE -s 'EXPORT_NAME="createMyModule"' \
		-sASSERTIONS=0 --profiling \
		-DIS_WASM -DBLAKE3_NO_AVX512 -DBLAKE3_NO_SSE2 -DBLAKE3_NO_AVX2

foo: $(EM_WASM_OUT)

all: $(RUST_WASM_OUT) $(RUST_NATIVE_OUT) $(TS_OUT)

publish: $(RUST_WASM_OUT) $(RUST_NATIVE_OUT) $(TS_OUT)
	npm publish --unsafe-perm
	cp package.json .original.package.json
	cat .original.package.json | jq -M 'del(.scripts.install) | .name = "blake3-wasm"' > package.json
	npm publish --unsafe-perm
	mv -f .original.package.json package.json

prepare:
	npm install

rust: $(RUST_WASM_OUT) $(RUST_NATIVE_OUT)

fmt: fmt-rs fmt-ts

fmt-rs: $(RUST_NATIVE_SRC) $(RUST_WASM_SRC)
	rustfmt $^

fmt-ts: $(TS_SRC)
	./node_modules/.bin/remark readme.md -f -o readme.md
	./node_modules/.bin/prettier --write "ts/**/*.ts" "*.md"

$(RUST_NATIVE_OUT): $(RUST_NATIVE_SRC)
ifeq ($(MODE), release)
	cd rs && ../node_modules/.bin/neon build --release
else
	cd rs && ../node_modules/.bin/neon build
endif
	mv rs/native/index.node $@

$(TS_OUT): $(TS_SRC) $(RUST_WASM_OUT)
	./node_modules/.bin/tsc
	./node_modules/.bin/tsc -p tsconfig.esm.json
	node dist/build/add-js-extensions
	node dist/build/generate-tasks

$(RUST_WASM_OUT): $(RUST_WASM_SRC)
	wasm-pack build rs/wasm --$(MODE) -t $(word 3, $(subst /, ,$@)) -d ../../$(dir $@)
	rm $(dir $@)/.gitignore

clean:
	rm -rf esm dist

prepare-binaries: $(TS_OUT)
	git checkout generate-binary
	git reset --hard origin/master
	./node_modules/.bin/tsc
	node dist/build/generate-tasks
	git add . && git commit -m "generate build tasks" || echo "No update to build tasks"
	git push -u origin generate-binary -f
	git checkout -

.PHONY: all clean prepare fmt fmt-rs fmt-ts prepare-binaries publish
