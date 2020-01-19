TARGETS=nodejs browser
MODE=dev

RUST_WASM_SRC = $(wildcard rs/wasm/src/*.rs)
RUST_WASM_OUT = $(patsubst %, dist/wasm/%/blake3_js_bg.wasm, $(TARGETS))
RUST_NATIVE_SRC = $(wildcard rs/native/src/*.rs)
RUST_NATIVE_OUT = dist/native.node
TS_SRC = $(wildcard ts/*.ts)
TS_OUT = pkg/index.js

all: $(RUST_WASM_OUT) $(RUST_NATIVE_OUT) $(TS_OUT)

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

$(RUST_WASM_OUT): $(RUST_WASM_SRC)
	wasm-pack build rs/wasm --$(MODE) -t $(word 3, $(subst /, ,$@)) -d ../../$(dir $@)
ifeq ($(MODE), release)
	wasm-opt -O4 -o $@.min $@
	mv $@.min $@
endif

clean:
	rm -rf pkg dist

prepare-binaries: $(TS_OUT)
	git checkout generate-binary
	git reset --hard origin/master
	node dist/build/generate-tasks
	git add . && git commit -m "generate build tasks" || echo "No update to build tasks"
	git push -u origin generate-binary -f
	git checkout -

.PHONY: all clean prepare fmt fmt-rs fmt-ts prepare-binaries
