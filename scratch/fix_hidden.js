const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Auth.jsx', 'utf-8');

const start = c.indexOf("import { LANGS } from '../utils/translations'");
const end = c.indexOf('// ─── Animated Waveform');

if (start !== -1 && end !== -1) {
  c = c.slice(0, start + 45) + '\n\n' + c.slice(end);
  fs.writeFileSync('frontend/src/pages/Auth.jsx', c, 'utf-8');
  console.log('Cleaned hidden chars');
}
