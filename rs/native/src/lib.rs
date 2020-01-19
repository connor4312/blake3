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
    init(_) {
      Ok(Blake3Hash {
        hasher: blake3::Hasher::new(),
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
      let mut target_bytes_ref = cx.argument::<JsBuffer>(0)?;
      let this = cx.this();

      {
          let guard = cx.lock();
          let instance = this.borrow(&guard);
          let target_bytes = target_bytes_ref.borrow_mut(&guard);
          let mut output_reader = instance.hasher.finalize_xof();
          output_reader.fill(target_bytes.as_mut_slice());
      }

        Ok(cx.undefined().upcast())
    }

    method free(mut cx) {
      // For compat with wasm code
      Ok(cx.undefined().upcast())
    }
  }
}

register_module!(mut m, {
    m.export_function("hash", hash)?;
    m.export_class::<JsHash>("Hasher")?;
    Ok(())
});