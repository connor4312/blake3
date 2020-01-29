use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash(data: &[u8], out: &mut [u8]) {
    let mut hasher = blake3::Hasher::new();
    hasher.update(data);
    let mut reader = hasher.finalize_xof();
    reader.fill(out);
}

#[wasm_bindgen]
pub fn create_hasher() -> Blake3Hash {
    Blake3Hash {
        hasher: blake3::Hasher::new(),
    }
}

#[wasm_bindgen]
pub fn create_keyed(key_slice: &[u8]) -> Blake3Hash {
    let mut key = [0; 32];
    key.copy_from_slice(key_slice);

    Blake3Hash {
        hasher: blake3::Hasher::new_keyed(&key),
    }
}

#[wasm_bindgen]
pub fn create_derive(context: String) -> Blake3Hash {
    Blake3Hash {
        hasher: blake3::Hasher::new_derive_key(&context),
    }
}

#[wasm_bindgen]
pub struct Blake3Hash {
    hasher: blake3::Hasher,
}

#[wasm_bindgen]
impl Blake3Hash {
    pub fn reader(&mut self) -> HashReader {
        HashReader {
            reader: self.hasher.finalize_xof(),
        }
    }

    pub fn update(&mut self, input_bytes: &[u8]) {
        self.hasher.update(input_bytes);
    }

    pub fn digest(&mut self, out: &mut [u8]) {
        let mut reader = self.hasher.finalize_xof();
        reader.fill(out);
    }
}

#[wasm_bindgen]
pub struct HashReader {
    reader: blake3::OutputReader,
}

#[wasm_bindgen]
impl HashReader {
    pub fn fill(&mut self, bytes: &mut [u8]) {
        self.reader.fill(bytes);
    }

    pub fn set_position(&mut self, position: u64) {
        self.reader.set_position(position);
    }
}
