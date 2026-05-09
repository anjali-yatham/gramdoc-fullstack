const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/Auth.jsx', 'utf-8');

// 1. Add currentScreen state
content = content.replace(
  "const [selectedLang, setSelectedLang] = useState(null)",
  "const [selectedLang, setSelectedLang] = useState(null)\n  const [currentScreen, setCurrentScreen] = useState('role')"
);

// 2. Replace Language screen gate with new SCREEN 1 & 2A
const gateStart = content.indexOf('// ── Language screen gate ──');
const gateEnd = content.indexOf('// ── Auth form', gateStart);
const oldGate = content.slice(gateStart, gateEnd);

const newScreens = `// ── Role Selection Screen (SCREEN 1) ──
  if (currentScreen === 'role') {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f7f3ed', fontFamily: 'Mukta, sans-serif' }}>
        {/* Left Panel - Brand */}
        <div style={{ flex: 1, background: '#0f3d2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(123,202,164,0.1)', filter: 'blur(50px)' }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ textAlign: 'center', zIndex: 10 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 48, fontWeight: 600, marginBottom: 12 }}>GramDoc</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em' }}>RURAL TELEMEDICINE</div>
          </motion.div>
          <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
            src={ladyDoctor} style={{ width: '65%', maxWidth: 350, marginTop: 40, objectFit: 'contain', zIndex: 10, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.3))' }} />
        </div>

        {/* Right Panel - Role Selection */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', marginBottom: 40 }}>
            Who are you today?
          </motion.h2>

          <div style={{ display: 'flex', gap: 24 }}>
            {/* Patient Card */}
            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setRole('patient'); setCurrentScreen('language'); }}
              style={{
                width: 220, height: 260, background: '#fff', borderRadius: 24, padding: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15,61,42,0.08)', cursor: 'pointer', border: '1px solid #e8d5bc'
              }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🧑‍🤝‍🧑</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f3d2a' }}>I am a Patient</div>
              <div style={{ fontSize: 13, color: '#6b5e50', textAlign: 'center', marginTop: 12 }}>Consult doctors and get prescriptions</div>
            </motion.div>

            {/* Doctor Card */}
            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setRole('doctor'); setSelectedLang('en'); setCurrentScreen('auth'); }}
              style={{
                width: 220, height: 260, background: '#fff', borderRadius: 24, padding: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15,61,42,0.08)', cursor: 'pointer', border: '1px solid #e8d5bc'
              }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>👨‍⚕️</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f3d2a' }}>I am a Doctor</div>
              <div style={{ fontSize: 13, color: '#6b5e50', textAlign: 'center', marginTop: 12 }}>Manage queue and write prescriptions</div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // ── Language Screen (SCREEN 2A) ──
  if (currentScreen === 'language') {
    return (
      <AnimatePresence>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'relative'}}>
          <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 100 }}>
             <button onClick={() => setCurrentScreen('role')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                ← Back
             </button>
          </div>
          <LanguageSelect onSelect={(langKey) => { setSelectedLang(langKey); setCurrentScreen('auth'); }} />
        </motion.div>
      </AnimatePresence>
    )
  }

  `;

content = content.replace(oldGate, newScreens);

// 3. Add Back/Language Navigation Button
const rightPanelIdx = content.indexOf('{/* RIGHT PANEL */}');
const afterRightPanel = content.slice(rightPanelIdx);
const rightPanelInnerDivIdx = afterRightPanel.indexOf('>');
const rightPanelInjectPos = rightPanelIdx + rightPanelInnerDivIdx + 1;

const navButton = `
        {/* Back/Language Navigation */}
        <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 50 }}>
          {role === 'doctor' ? (
            <button onClick={() => setCurrentScreen('role')} style={{ background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              ← Back
            </button>
          ) : (
            <button onClick={() => setCurrentScreen('language')} style={{ background: '#EAF3DE', color: '#0f3d2a', border: '1px solid #7bcaa4', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              🌐 Change Language
            </button>
          )}
        </div>`;

content = content.slice(0, rightPanelInjectPos) + navButton + content.slice(rightPanelInjectPos);

// 4. Remove Role Toggle
const roleToggleStart = content.indexOf('{/* Role toggle */}');
const roleToggleEnd = content.indexOf('{/* ── PATIENT ── */}');
if (roleToggleStart !== -1 && roleToggleEnd !== -1) {
    const toggleBlock = content.slice(roleToggleStart, roleToggleEnd);
    content = content.replace(toggleBlock, '');
}

fs.writeFileSync('frontend/src/pages/Auth.jsx', content, 'utf-8');
console.log('Refactoring complete!');
