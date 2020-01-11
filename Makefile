RUST_SRC = $(wildcard src/*.rs)
RUST_OUT = pkg/nodejs/blake3_bg.wasm pkg/web/blake3_bg.wasm
TS_SRC = $(wildcard ts/*.ts)
TS_OUT = pkg/index.js
MIN_TMP = min.wasm

all: $(RUST_OUT) $(TS_OUT)

$(TS_OUT): $(TS_SRC)
	tsc

pkg/nodejs/blake3_bg.wasm: $(RUST_SRC)
	wasm-pack build --release -t nodejs -d pkg/nodejs
	wasm-opt -O4 -o $(MIN_TMP) $@
	mv $(MIN_TMP) $@

pkg/web/blake3_bg.wasm: $(RUST_SRC)
	wasm-pack build --release -t web -d pkg/web
	wasm-opt -O4 -o $(MIN_TMP) $@
	mv $(MIN_TMP) $@

clean:
	rm -rf pkg dist $(MIN_TMP)

.PHONY: all clean
