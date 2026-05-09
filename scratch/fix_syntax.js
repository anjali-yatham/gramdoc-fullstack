const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Auth.jsx', 'utf-8');

// Ensure clean removal of the malformed text at the top
const malformedStart = c.indexOf('గు ఎంచుకున్నారు.');
if (malformedStart !== -1) {
    c = c.slice(0, malformedStart) + c.slice(c.indexOf('// ─── Animated Waveform'));
}
const anotherMalformed = c.indexOf('గు ఎంచుకున్నారు.');
if (anotherMalformed !== -1) {
    c = c.slice(0, anotherMalformed) + c.slice(c.indexOf('// ─── Animated Waveform'));
}

// Update voice greeting texts
const textStart = c.indexOf('const texts = [');
const textEnd = c.indexOf(']', textStart);
if (textStart !== -1 && textEnd !== -1) {
  const newTexts = `const texts = [
      { text: 'Namaste! Welcome to GramDoc. Please select your language.', lang: 'en-IN' },
      { text: 'नमस्ते! GramDoc में आपका स्वागत है। कृपया अपनी भाषा चुनें।', lang: 'hi-IN' },
      { text: 'నమస్కారం! GramDoc కి స్వాగతం. దయచేసి మీ భాషను ఎంచుకోండి.', lang: 'te-IN' },
    `;
  c = c.slice(0, textStart) + newTexts + c.slice(textEnd);
}

fs.writeFileSync('frontend/src/pages/Auth.jsx', c, 'utf-8');
console.log('Fixed syntax and updated audio greetings');
