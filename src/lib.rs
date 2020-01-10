use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;
use std::cell::Cell;

#[wasm_bindgen]
pub fn hash(data: &[u8]) -> Uint8Array {
  let hash = blake3::hash(data);

  unsafe {
    Uint8Array::view(hash.as_bytes())
  }
}

#[wasm_bindgen]
pub struct Blake3Hash {
    hasher: Cell<blake3::Hasher>,
}

#[wasm_bindgen]
impl Blake3Hash {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Blake3Hash {
      Blake3Hash {
            hasher: Cell::new(blake3::Hasher::new()),
        }
    }

    pub fn update(&mut self, input_bytes: &[u8]) {
        let hasher = self.hasher.get_mut();
        hasher.update(input_bytes);
    }

    pub fn digest(&mut self) -> Uint8Array {
        let hasher = self.hasher.get_mut();
        let output = hasher.finalize();

        unsafe {
          Uint8Array::view(output.as_bytes())
        }
    }
}
