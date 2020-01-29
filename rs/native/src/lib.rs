use neon::prelude::*;
use neon::register_module;

fn reader_to_buffer<'a, T: neon::object::This>(
    cx: &mut CallContext<'a, T>,
    output_reader: &mut blake3::OutputReader,
    length: u32,
) -> JsResult<'a, JsValue> {
    let mut output_buffer = cx.buffer(length)?;
    cx.borrow_mut(&mut output_buffer, |data| {
        output_reader.fill(data.as_mut_slice());
    });

    Ok(output_buffer.upcast())
}

pub fn hash(mut cx: FunctionContext) -> JsResult<JsValue> {
    let input_buffer = cx.argument::<JsBuffer>(0)?;
    let length = cx.argument::<JsNumber>(1)?;
    let input_bytes = cx.borrow(&input_buffer, |data| data.as_slice::<u8>());

    let mut hasher = blake3::Hasher::new();
    hasher.update(input_bytes);
    let mut reader = hasher.finalize_xof();
    reader_to_buffer(&mut cx, &mut reader, length.value() as u32)
}

pub struct Blake3Hash {
    hasher: blake3::Hasher,
}

declare_types! {
    pub class JsHash for Blake3Hash {
        // Constructing is awkward in neon, so this is how this works:
        // 0 args = new regular hash
        // 1 args = use the first arg (a Buffer) as the key
        // 2 args = use the second arg (a String) to derive a key
        init(mut cx) {
            let hasher = match cx.len() {
                0 => blake3::Hasher::new(),
                1 => {
                    let key_buffer = cx.argument::<JsBuffer>(0)?;
                    let key_bytes = cx.borrow(&key_buffer, |data| {
                        let mut key = [0; 32];
                        key.copy_from_slice(data.as_slice::<u8>());
                        key
                    });
                    blake3::Hasher::new_keyed(&key_bytes)
                },
                2 => {
                    let context_data = cx.argument::<JsString>(1)?;
                    blake3::Hasher::new_derive_key(&context_data.value())
                },
                _ => panic!("unexpected number of arguments"),
            };

            Ok(Blake3Hash {
                hasher: hasher,
            })
        }

        method update(mut cx) {
            let input_buffer = cx.argument::<JsBuffer>(0)?;
            let mut this = cx.this();

            {
                let guard = cx.lock();
                let mut instance = this.borrow_mut(&guard);
                let input_bytes = input_buffer.borrow(&guard);
                instance.hasher.update(input_bytes.as_slice::<u8>());
            }

            Ok(cx.undefined().upcast())
        }

        method digest(mut cx) {
            let target_bytes_ref = cx.argument::<JsBuffer>(0)?;
            let this = cx.this();

            {
                let guard = cx.lock();
                let instance = this.borrow(&guard);
                let target_bytes = target_bytes_ref.borrow(&guard);
                let mut output_reader = instance.hasher.finalize_xof();
                output_reader.fill(target_bytes.as_mut_slice());
            }

            Ok(cx.undefined().upcast())
        }

        method free(mut cx) {
            // For compat with wasm code
            Ok(cx.undefined().upcast())
        }

        method reader(mut cx) {
            let this = cx.this();
            Ok(JsReader::new(&mut cx, vec![this])?.upcast())
        }
    }
}

pub struct HashReader {
    reader: blake3::OutputReader,
}

declare_types! {
    pub class JsReader for HashReader {
        init(mut cx) {
            let hash_ref = cx.argument::<JsHash>(0)?;
            let reader = cx.borrow(&hash_ref, |h| h.hasher.finalize_xof());

            Ok(HashReader {
                reader: reader
            })
        }

        method fill(mut cx) {
            let mut target_bytes_ref = cx.argument::<JsBuffer>(0)?;
            let mut this = cx.this();

            {
                let guard = cx.lock();
                let mut instance = this.borrow_mut(&guard);
                let target_bytes = target_bytes_ref.borrow_mut(&guard);
                instance.reader.fill(target_bytes.as_mut_slice())
            }

            Ok(cx.undefined().upcast())
        }

        method set_position(mut cx) {
            // Neon bindings don't support bigint, so use a buffer instead
            // https://github.com/neon-bindings/neon/issues/376
            let position_arg = cx.argument::<JsBuffer>(0)?;
            let position_slice = cx.borrow(&position_arg, |p| p.as_slice::<u8>());

            let mut position_array = [0; 8];
            position_array.copy_from_slice(position_slice);

            let position = u64::from_be_bytes(position_array);
            let mut this = cx.this();

            {
                let guard = cx.lock();
                let mut instance = this.borrow_mut(&guard);
                instance.reader.set_position(position);
            }

            Ok(cx.undefined().upcast())
        }
    }
}

register_module!(mut m, {
    m.export_function("hash", hash)?;
    m.export_class::<JsHash>("Hasher")?;
    Ok(())
});
