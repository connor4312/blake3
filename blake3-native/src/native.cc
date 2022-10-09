#include <blake3.h>
#include <napi.h>

static const size_t KEY_REQUIRED_LENGTH = 32;
static const size_t DEFAULT_HASH_LENGTH = 32;
static const size_t ITERATOR_STEP_SIZE = 1024;
static const uint64_t MAX_HASH_POSITION = 18446744073709551615U;

struct InstanceData {
  Napi::FunctionReference *HashReader;
  Napi::FunctionReference *Hash;
};

class HashReader : public Napi::ObjectWrap<HashReader> {
public:
  static Napi::Function Init(Napi::Env &env, Napi::Object &exports) {
    Napi::Function func = DefineClass(
        env, "HashReader",
        {InstanceAccessor("position", &HashReader::GetPosition,
                          &HashReader::SetPosition),
         InstanceMethod("readInto", &HashReader::ReadInto),
         InstanceMethod("read", &HashReader::Read),
         InstanceMethod("view", &HashReader::Read),
         InstanceMethod(Napi::Symbol::WellKnown(env, "iterator").Unwrap(),
                        &HashReader::Iterator)});

    return func;
  }

  HashReader(const Napi::CallbackInfo &info)
      : Napi::ObjectWrap<HashReader>(info) {
    this->position = 0;
  }

  void SetHasher(blake3_hasher *hasher) { this->hasher = *hasher; }

private:
  /**
   * Returns the position of the reader in the hash. Can be written to to seek.
   */
  Napi::Value GetPosition(const Napi::CallbackInfo &info) {
    return Napi::BigInt::New(info.Env(), this->position);
  }

  /**
   * Returns the position of the reader in the hash. Can be written to to seek.
   */
  void SetPosition(const Napi::CallbackInfo &info, const Napi::Value &value) {
    Napi::Env env = info.Env();
    if (!value.IsBigInt()) {
      Napi::TypeError::New(env, "Expected position to be a bigint")
          .ThrowAsJavaScriptException();
      return;
    }

    bool lossless;
    uint64_t position = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    if (!lossless || position > MAX_HASH_POSITION) {
      Napi::RangeError::New(env, "Cannot seek past the max hash position")
          .ThrowAsJavaScriptException();
      return;
    }

    this->position = position;
  }

  Napi::Value ReadInto(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() <= 0) {
      Napi::TypeError::New(env, "Argument expected")
          .ThrowAsJavaScriptException();
      return Napi::Number::New(env, 0);
    }

    auto arg0 = info[0];
    if (!arg0.IsTypedArray()) {
      Napi::TypeError::New(env, "Expected a typed array")
          .ThrowAsJavaScriptException();
      return Napi::Number::New(env, 0);
    }

    Napi::TypedArray ta = arg0.As<Napi::TypedArray>();
    uint64_t readBytes =
        std::min((uint64_t)ta.ByteLength(), MAX_HASH_POSITION - this->position);

    blake3_hasher_finalize_seek(
        &this->hasher, this->position,
        ((uint8_t *)ta.ArrayBuffer().Data()) + ta.ByteOffset(), readBytes);
    this->position += readBytes;
    return Napi::Number::New(env, readBytes);
  }

  Napi::Value Read(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() <= 0) {
      Napi::TypeError::New(env, "Argument expected")
          .ThrowAsJavaScriptException();
      return Napi::Number::New(env, 0);
    }

    auto arg0 = info[0];
    if (!arg0.IsNumber()) {
      Napi::TypeError::New(env, "Expected a number array")
          .ThrowAsJavaScriptException();
      return Napi::Number::New(env, 0);
    }

    uint64_t requestedBytes =
        (uint64_t)(std::max((int64_t)0, arg0.As<Napi::Number>().Int64Value()));
    uint64_t readBytes =
        std::min(requestedBytes, MAX_HASH_POSITION - this->position);

    Napi::Buffer<uint8_t> out =
        Napi::Buffer<uint8_t>::New(env, (size_t)readBytes);
    blake3_hasher_finalize_seek(&this->hasher, this->position, out.Data(),
                                out.Length());
    this->position += readBytes;
    return out;
  }

  Napi::Value Iterator(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    Napi::Object iterator = Napi::Object::New(env);

    Napi::Object iteratorResult = Napi::Object::New(env);
    Napi::Buffer<uint8_t> view =
        Napi::Buffer<uint8_t>::New(env, ITERATOR_STEP_SIZE);

    iterator["next"] =
        Napi::Function::New(env, [&](const Napi::CallbackInfo &info) {
          Napi::Env env = info.Env();
          uint64_t readBytes = std::min((uint64_t)ITERATOR_STEP_SIZE,
                                        MAX_HASH_POSITION - this->position);
          blake3_hasher_finalize_seek(&this->hasher, this->position,
                                      view.Data(), readBytes);
          this->position += readBytes;

          iteratorResult["done"] =
              Napi::Boolean::New(env, this->position == MAX_HASH_POSITION);
          if (readBytes < ITERATOR_STEP_SIZE) {
            iteratorResult["value"] = view.Get("subarray")
                                          .Unwrap()
                                          .As<Napi::Function>()
                                          .Call({
                                              Napi::Number::New(env, 0),
                                              Napi::Number::New(env, readBytes),
                                          })
                                          .Unwrap();
          } else {
            iteratorResult["value"] = view;
          }

          return iteratorResult;
        });

    return iterator;
  }

  uint64_t position;
  blake3_hasher hasher;
};

class Hash : public Napi::ObjectWrap<Hash> {
public:
  static Napi::Function Init(Napi::Env &env, Napi::Object &exports) {
    Napi::Function func =
        DefineClass(env, "Hash",
                    {InstanceMethod("update", &Hash::Update),
                     InstanceMethod("digest", &Hash::Digest),
                     InstanceMethod("reader", &Hash::Reader)});

    exports.Set("createHash", Napi::Function::New(env, &Hash::CreateHash));
    exports.Set("createKeyed", Napi::Function::New(env, &Hash::CreateKeyed));
    exports.Set("createDeriveKey",
                Napi::Function::New(env, &Hash::CreateDeriveKey));

    return func;
  }

  Hash(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Hash>(info) {}

  static Napi::Value CreateHash(const Napi::CallbackInfo &info) {
    struct InstanceData *id = info.Env().GetInstanceData<InstanceData>();
    Napi::Value out = id->Hash->New({}).Unwrap();
    Hash *hash = Unwrap(out.As<Napi::Object>());
    blake3_hasher_init(&hash->hasher);
    return out;
  }

  static Napi::Value CreateKeyed(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() <= 0) {
      Napi::TypeError::New(env, "Argument expected")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    auto arg0 = info[0];
    if (!arg0.IsTypedArray()) {
      Napi::TypeError::New(env, "First argument should be a typed array")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    Napi::TypedArray ta = arg0.As<Napi::TypedArray>();
    if (ta.ByteLength() != KEY_REQUIRED_LENGTH) {
      Napi::TypeError::New(env, "BLAKE3 key must be exactly 32 bytes")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    struct InstanceData *id = env.GetInstanceData<InstanceData>();
    Napi::Value out = id->Hash->New({}).Unwrap();
    Hash *hash = Unwrap(out.As<Napi::Object>());
    blake3_hasher_init_keyed(
        &hash->hasher, ((uint8_t *)ta.ArrayBuffer().Data()) + ta.ByteOffset());
    return out;
  }

  static Napi::Value CreateDeriveKey(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() <= 0) {
      Napi::TypeError::New(env, "Argument expected")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    auto arg0 = info[0];
    if (!arg0.IsTypedArray()) {
      Napi::TypeError::New(env, "First argument should be a typed array")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }

    Napi::TypedArray ta = arg0.As<Napi::TypedArray>();
    struct InstanceData *id = env.GetInstanceData<InstanceData>();
    Napi::Value out = id->Hash->New({}).Unwrap();
    Hash *hash = Unwrap(out.As<Napi::Object>());
    blake3_hasher_init_derive_key_raw(
        &hash->hasher, ((uint8_t *)ta.ArrayBuffer().Data()) + ta.ByteOffset(),
        ta.ByteLength());
    return out;
  }

private:
  Napi::Value Update(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() <= 0) {
      Napi::TypeError::New(env, "Argument expected")
          .ThrowAsJavaScriptException();
      return info.This();
    }

    auto arg0 = info[0];
    if (arg0.IsTypedArray()) {
      Napi::TypedArray ta = arg0.As<Napi::TypedArray>();
      blake3_hasher_update(
          &this->hasher, ((uint8_t *)ta.ArrayBuffer().Data()) + ta.ByteOffset(),
          ta.ByteLength());
    } else {
      Napi::TypeError::New(env, "Expected a string or typed array")
          .ThrowAsJavaScriptException();
    }

    return info.This();
  }

  Napi::Value Digest(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    size_t length = DEFAULT_HASH_LENGTH;
    if (info[0].IsNumber()) {
      length = (size_t)(info[0].As<Napi::Number>().Uint32Value());
    }

    Napi::Buffer<uint8_t> out = Napi::Buffer<uint8_t>::New(env, (size_t)length);
    blake3_hasher_finalize_seek(&this->hasher, 0, out.Data(), out.Length());
    return out;
  }

  Napi::Value Reader(const Napi::CallbackInfo &info) {
    struct InstanceData *id = info.Env().GetInstanceData<InstanceData>();
    Napi::Value out = id->HashReader->New({}).Unwrap();

    HashReader *reader =
        Napi::ObjectWrap<HashReader>::Unwrap(out.As<Napi::Object>());
    reader->SetHasher(&this->hasher);

    return out;
  }

  blake3_hasher hasher;
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  struct InstanceData *id = new struct InstanceData;

  id->HashReader = new Napi::FunctionReference();
  *(id->HashReader) = Napi::Persistent(HashReader::Init(env, exports));

  id->Hash = new Napi::FunctionReference();
  *(id->Hash) = Napi::Persistent(Hash::Init(env, exports));

  env.SetInstanceData<InstanceData>(id);

  return exports;
}

NODE_API_MODULE(addon, Init)
