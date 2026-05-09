import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGS } from '../utils/translations'

export default function LanguageSelect() {
  const navigate = useNavigate()
  const [hoveredLang, setHoveredLang] = useState(null)

  const handleSelect = (key) => {
    localStorage.setItem('gramdoc_lang', key)
    navigate(-1)
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f3d2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Mukta, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* bg orbs */}
      {[['60%', '-10%', 500, 'rgba(123,202,164,0.08)', 20], ['-10%', '40%', 400, 'rgba(196,101,58,0.06)', 25], ['30%', '80%', 350, 'rgba(123,202,164,0.06)', 18]].map(([t, l, s, bg, d], i) => (
        <motion.div key={i} style={{ position: 'absolute', top: t, left: l, width: s, height: s, borderRadius: '50%', background: bg, pointerEvents: 'none' }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }} transition={{ duration: d, repeat: Infinity, ease: 'linear' }} />
      ))}

      {/* dot grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}>
        <defs><pattern id="gd" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.4)" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#gd)" />
      </svg>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 10, maxWidth: 480, padding: '0 24px' }}>

        <div style={{ position: 'absolute', top: -100, left: -20, zIndex: 100 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            ← Back
          </button>
        </div>

        {/* Brand */}
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 32, color: '#fff', fontWeight: 600, marginBottom: 6 }}>GramDoc</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 40, letterSpacing: '0.08em' }}>RURAL TELEMEDICINE</div>

        {/* Avatar */}
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '2px solid rgba(123,202,164,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>
          🌐
        </motion.div>

        {/* Language buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 32, lineHeight: 1.8 }}>
            Choose your language to continue<br />
            अपनी भाषा चुनें · మీ భాషను ఎంచుకోండి
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(LANGS).map(([key, lang]) => (
              <motion.button key={key}
                onClick={() => handleSelect(key)}
                onMouseEnter={() => setHoveredLang(key)}
                onMouseLeave={() => setHoveredLang(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: hoveredLang === key ? 'rgba(123,202,164,0.25)' : 'rgba(255,255,255,0.08)',
                  border: hoveredLang === key ? '1.5px solid #7bcaa4' : '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 16, padding: '20px 32px', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'center', minWidth: 130,
                }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{lang.flag}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Mukta, sans-serif' }}>{lang.native}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{lang.label}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
