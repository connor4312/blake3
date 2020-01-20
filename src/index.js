import './index.css';

const els = {
  input: document.getElementById('hash-input'),
  output: document.getElementById('hash-output'),
  length: document.getElementById('bytes'),
};

const blake3 = import('blake3/browser');

function getSelectValue(name) {
  const radios = document.getElementsByName(name);
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i].value;
    }
  }

  return null;
}

[els.length, els.input].forEach(el => {
  el.addEventListener('change', rehash);
  el.addEventListener('keyup', rehash);
});

[...document.querySelectorAll('input[type="radio"]')].forEach(el =>
  el.addEventListener('change', rehash),
);

async function rehash() {
  try {
    const input = Buffer.from(els.input.value, getSelectValue('input-encoding'));
    els.output.value = 'Hashing...';
    const length = Number(els.length.value);
    const { hash } = await blake3;
    els.output.value = hash(input, { length }).toString(getSelectValue('output-encoding'));
  } catch (e) {
    console.error(e);
    els.output.value = e.stack || e.message || String(e);
  }
}
