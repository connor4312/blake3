{
  "targets": [
    {
      "target_name": "blake3",
      "cflags!": [
        "-fno-exceptions",
        "-march=native",
        "-O3"
      ],
      "cflags_cc!": [
        "-fno-exceptions",
        "-march=native",
        "-O3"
      ],
      "sources": [
        "ts/node-native/native.cc",
        "BLAKE3/c/blake3.c",
        "BLAKE3/c/blake3_dispatch.c",
        "BLAKE3/c/blake3_portable.c",
        "<!@(node -p \"require('fs').readdirSync('./BLAKE3/c').filter(f=>f.endsWith(process.platform==='win32'?'_msvc.asm':'_unix.S')).map(f=>'BLAKE3/c/'+f).join(' ')\")",
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "BLAKE3/c"
      ],
      "libraries": [],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")",
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "NODE_ADDON_API_ENABLE_MAYBE"
      ]
    }
  ]
}
