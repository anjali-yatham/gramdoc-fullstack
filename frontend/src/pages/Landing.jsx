import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'

export default function Landing() {
  const nav = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [phase, setPhase] = useState(1) // 1: Intro, 2: Main
  const [showBack, setShowBack] = useState(false)
  const [imgError, setImgError] = useState(false)
  const containerRef = useRef(null)
  const hasPlayedIntroChimeRef = useRef(false)

  const featuresRef = useRef(null)
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" })

  useEffect(() => {
    // Phase 1 -> Phase 2 (Reveal)
    const t1 = setTimeout(() => setPhase(2), 2400)

    // Scroll listener
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setShowBack(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll)

    return () => {
      clearTimeout(t1)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (phase !== 1 || shouldReduceMotion || hasPlayedIntroChimeRef.current) return

    const playIntroChime = () => {
      if (hasPlayedIntroChimeRef.current) return
      hasPlayedIntroChimeRef.current = true

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const now = ctx.currentTime

        const playTone = (freq, start, duration, gainValue) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.0001, start)
          gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.03)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(start)
          osc.stop(start + duration)
        }

        playTone(740, now + 0.02, 0.22, 0.08)
        playTone(987, now + 0.14, 0.26, 0.07)

        setTimeout(() => {
          if (ctx.state !== 'closed') ctx.close().catch(() => {})
        }, 700)
      } catch (_) {}
      window.removeEventListener('mousedown', playIntroChime)
    }

    window.addEventListener('mousedown', playIntroChime)
    return () => window.removeEventListener('mousedown', playIntroChime)
  }, [phase, shouldReduceMotion])

  const logoLetters = "GramDoc".split("")

  const features = [
    { icon: '🤖', title: 'AI Pre-Triage', desc: 'Smart symptom checker routes you to the right specialist instantly' },
    { icon: '🗣️', title: 'Multilingual', desc: 'Speak in Telugu, Hindi, Tamil — AI transcribes for your doctor' },
    { icon: '📄', title: 'Digital Prescriptions', desc: 'QR-coded Rx sent straight to your phone. No paper, no forgery.' },
    { icon: '📶', title: 'Works Offline', desc: 'Fill symptom forms without internet. Syncs when connectivity returns.' },
    { icon: '👩‍⚕️', title: 'ASHA Integration', desc: 'Community health workers help register and follow up patients' },
    { icon: '🚨', title: 'Emergency SOS', desc: 'One tap sends GPS location to ambulance + family contacts' },
  ]

  // Stats counting component
  const Counter = ({ value, duration = 2, delay = 2 }) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
      if (phase < 2 || shouldReduceMotion) {
        setCount(value)
        return
      }
      let timer = setTimeout(() => {
        let startTime = null
        const end = parseFloat(value)
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp
          const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
          setCount(progress * end)
          if (progress < 1) window.requestAnimationFrame(step)
        }
        window.requestAnimationFrame(step)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }, [value, phase, shouldReduceMotion])
    return <span>{count.toLocaleString(undefined, { maximumFractionDigits: value % 1 === 0 ? 0 : 1 })}</span>
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh', width: '100vw', overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', background: '#fdf6ec', fontFamily: 'Mukta, sans-serif'
      }}
    >
      <AnimatePresence>
        {phase === 1 && !shouldReduceMotion && (
          <motion.div
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, background: '#fdf6ec',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Heartbeat Line */}
            <div style={{ position: 'relative', width: 300, height: 100 }}>
              <svg width="300" height="100" viewBox="0 0 300 100">
                <motion.path
                  d="M 0 50 L 100 50 L 115 10 L 140 90 L 155 50 L 300 50"
                  fill="transparent"
                  stroke="#0f3d2a"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </svg>

              {/* Pulse Ripples */}
              <div style={{ position: 'absolute', top: '50%', left: '42%', transform: 'translate(-50%, -50%)' }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ delay: 1.1 + (i * 0.2), duration: 0.8, ease: "easeOut" }}
                    style={{
                      position: 'absolute', width: 40, height: 40, borderRadius: '50%',
                      border: '2px solid #7bcaa4', top: -20, left: -20
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Logo Pulse In */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.05, 1], opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
              style={{ textAlign: 'center', marginTop: 20 }}
            >
              <div style={{
                fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 48,
                color: '#0f3d2a', fontWeight: 700, position: 'relative'
              }}>
                GramDoc
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  style={{ height: 2, background: '#7bcaa4', position: 'absolute', bottom: 4, left: 0 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                style={{ fontSize: 14, color: '#6b5e50', marginTop: 4, fontWeight: 600, letterSpacing: 1 }}
              >
                Rural Telemedicine Platform
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV BAR */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={phase === 2 ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 60px', position: 'sticky', top: 0, zIndex: 100,
          background: showBack ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: showBack ? 'blur(12px)' : 'none',
          boxShadow: showBack ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
          transition: 'background 0.4s', borderBottom: showBack ? '0.5px solid #e8d5bc' : 'none'
        }}
      >
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 22, color: '#0f3d2a', fontWeight: 600 }}>GramDoc</div>
      </motion.nav>

      {/* HERO SECTION */}
      <section style={{
        display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center',
        padding: '0 60px', maxWidth: 1400, margin: '0 auto', position: 'relative'
      }}>
        <div style={{ flex: 1, zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={phase === 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              display: 'inline-block', background: '#eaf6f0', color: '#3B6D11', fontSize: 11,
              fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginBottom: 24
            }}
          >
            🌿 12 doctors available now
          </motion.div>

          <div style={{ overflow: 'hidden', marginBottom: 24 }}>
            {["Healthcare that comes", "to your doorstep.", "on every phone."].map((text, i) => (
              <motion.h1
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={phase === 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                style={{
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 62,
                  color: i === 2 ? '#7bcaa4' : '#0f3d2a', fontWeight: 700,
                  lineHeight: 1, margin: 0
                }}
              >
                {text}
              </motion.h1>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={phase === 2 ? { opacity: 1 } : {}}
            transition={{ delay: 1.1, duration: 0.6 }}
            style={{ fontSize: 18, color: '#6b5e50', maxWidth: 480, lineHeight: 1.7, marginBottom: 40 }}
          >
            GramDoc connects rural patients directly with verified specialists —
            in their own language — in under 5 minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={phase === 2 ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 1.3, duration: 0.5 }}
            style={{ display: 'flex', gap: 16 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav('/auth')}
              style={{
                background: '#0f3d2a', color: '#fff', border: 'none',
                borderRadius: 14, padding: '16px 36px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px rgba(15,61,42,0.2)'
              }}
            >Talk to a Doctor Now →</motion.button>

            <motion.button
              onClick={() => {
                const el = containerRef.current
                const target = document.getElementById('features-section')
                if (el && target) el.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
              }}
              whileHover={{ scale: 1.05 }}
              style={{
                background: '#fff', color: '#0f3d2a', border: '1px solid #e8d5bc',
                borderRadius: 14, padding: '16px 32px', fontSize: 16,
                fontWeight: 600, cursor: 'pointer'
              }}
            >See How It Works</motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={phase === 2 ? { opacity: 1 } : {}}
            transition={{ delay: 1.6, duration: 0.6 }}
            style={{ display: 'flex', gap: 48, marginTop: 60 }}
          >
            {[
              { val: 1284, label: 'Patients Treated' },
              { val: 65, label: 'Verified Doctors' },
              { val: 4.3, label: 'Avg Wait (min)' }
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, color: '#0f3d2a', fontWeight: 700 }}>
                  <Counter value={s.val} />{s.val === 1284 ? '+' : ''}
                </div>
                <div style={{ fontSize: 12, color: '#6b5e50', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: 1, height: '100%', position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%',
          background: 'linear-gradient(135deg, #0f3d2a, #0a1a0f)',
          backgroundSize: '200% 200%',
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          {/* Ambient Gradient Animation */}
          <motion.div
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(123,202,164,0.1), transparent)' }}
          />

          {/* Heartbeat Dot */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', left: '20%', top: '45%', width: 8, height: 8,
              borderRadius: '50%', background: '#7bcaa4', zIndex: 1
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={phase === 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          >
            <motion.img
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              src="/doctor-illustration.png"
              onError={() => setImgError(true)}
              style={{
                height: '85vh', objectFit: 'contain',
                filter: 'drop-shadow(-20px 20px 40px rgba(0,0,0,0.3))'
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features-section"
        ref={featuresRef}
        style={{ position: 'relative', background: '#fdf6ec', overflow: 'hidden', padding: '100px 60px' }}
      >
        {/* Animated Orbs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {[
            { w: 400, h: 400, bg: 'rgba(123,202,164,0.1)', t: -100, l: -100, dur: 18 },
            { w: 300, h: 300, bg: 'rgba(15,61,42,0.06)', t: '40%', r: -50, dur: 22 },
            { w: 250, h: 250, bg: 'rgba(196,101,58,0.06)', b: -50, l: '30%', dur: 16 }
          ].map((o, i) => (
            <motion.div
              key={i}
              animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute', width: o.w, height: o.h, borderRadius: '50%',
                background: o.bg, top: o.t, left: o.l, right: o.r, bottom: o.b, filter: 'blur(40px)'
              }}
            />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 42, color: '#0f3d2a', marginBottom: 16 }}>Everything built for rural Bharat</h2>
            <div style={{ width: 80, height: 3, background: 'linear-gradient(90deg, #7bcaa4, #c4653a)', margin: '0 auto' }} />
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.03 }}
                style={{
                  background: 'rgba(255,255,255,0.8)', padding: '32px', borderRadius: 24,
                  border: '1px solid #e8d5bc', transition: 'all 0.3s ease'
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eaf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f3d2a', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b5e50', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 60px', background: '#0f3d2a', color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
        © 2025 GramDoc · Rural Telemedicine Platform · Made with ❤️ for Bharat
      </footer>

      {/* BACK TO TOP */}
      <AnimatePresence>
        {showBack && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              position: 'fixed', bottom: 36, right: 36, zIndex: 9999, width: 52, height: 52,
              borderRadius: '50%', background: '#0f3d2a', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 22, boxShadow: '0 6px 24px rgba(15,61,42,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >↑</motion.button>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,700&family=Mukta:wght@400;600;700&display=swap');
        body { margin: 0; overflow: hidden; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
