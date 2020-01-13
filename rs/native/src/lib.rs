use neon::prelude::*;
use neon::register_module;

pub fn hash(mut cx: FunctionContext) -> JsResult<JsBuffer> {
  let input_buffer = cx.argument::<JsBuffer>(0)?;
  let input_bytes = cx.borrow(&input_buffer, |data| data.as_slice::<u8>());

  let hash = blake3::hash(input_bytes);
  let hash_bytes = hash.as_bytes();
  
  let mut output_buffer = cx.buffer(blake3::OUT_LEN as u32)?;
  cx.borrow_mut(&mut output_buffer, |data| {
    let raw = data.as_mut_slice();
    raw.copy_from_slice(hash_bytes);
  });
  
  Ok(output_buffer)
}

register_module!(mut m, {
  m.export_function("hash", hash)?;
  Ok(())
});