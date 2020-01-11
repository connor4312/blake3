TARGETS=nodejs web
MODE=release

RUST_SRC = $(wildcard src/*.rs)
RUST_OUT = $(patsubst %, pkg/%/blake3_bg.wasm, $(TARGETS))
TS_SRC = $(wildcard ts/*.ts)
TS_OUT = pkg/index.js

all: $(RUST_OUT) $(TS_OUT)

prepare:
	npm install

$(TS_OUT): $(TS_SRC) $(RUST_OUT)
	tsc

$(RUST_OUT): $(RUST_SRC)
	wasm-pack build --$(MODE) -t $(word 2, $(subst /, ,$@)) -d $(dir $@)
ifeq ($(MODE), release)
	wasm-opt -O4 -o $@.min $@
	mv $@.min $@
endif

clean:
	rm -rf pkg dist

.PHONY: all clean prepare
