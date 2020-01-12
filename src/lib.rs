use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash(data: &[u8], out: &mut [u8]) {
  let hash = blake3::hash(data);
  out.copy_from_slice(hash.as_bytes());
}

#[wasm_bindgen]
pub struct Blake3Hash {
    hasher: blake3::Hasher,
}

#[wasm_bindgen]
impl Blake3Hash {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Blake3Hash {
      Blake3Hash {
            hasher: blake3::Hasher::new(),
        }
    }

    pub fn update(&mut self, input_bytes: &[u8]) {
        self.hasher.update(input_bytes);
    }

    pub fn digest(&mut self, out: &mut [u8]) {
        let output = self.hasher.finalize();
        out.copy_from_slice(output.as_bytes());
    }
}
