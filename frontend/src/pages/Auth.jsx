import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ladyDoctor from '../assets/lady_doctor.png'

import { LANGS } from '../utils/translations'


// ─── Language Screen ───────────────────────────────────────────────────────────
// ─── Language Screen ───────────────────────────────────────────────────────────
function LanguageSelect({ onSelect }) {
  const [hoveredLang, setHoveredLang] = useState(null)

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f3d2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Mukta, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* bg orbs */}
      {[['60%', '-10%', 500, 'rgba(123,202,164,0.08)', 20], ['- 10%', '40%', 400, 'rgba(196,101,58,0.06)', 25], ['30%', '80%', 350, 'rgba(123,202,164,0.06)', 18]].map(([t, l, s, bg, d], i) => (
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

        {/* Brand */}
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 32, color: '#fff', fontWeight: 600, marginBottom: 6 }}>GramDoc</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 40, letterSpacing: '0.08em' }}>RURAL TELEMEDICINE</div>

        {/* Avatar */}
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '2px solid rgba(123,202,164,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>
          🩺
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
                onClick={() => onSelect(key)}
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

// ─── Main Auth Component ────────────────────────────────────────────────────────
export default function Auth() {
  const nav = useNavigate()
  const [selectedLang, setSelectedLang] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('role')
  const [role, setRole] = useState('patient')
  const [method, setMethod] = useState('phone')
  const [pharmacyIsSignup, setPharmacyIsSignup] = useState(false)
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [receivedOtp, setReceivedOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [doctorStep, setDoctorStep] = useState(1)
  const [dd, setDd] = useState({ name: '', email: '', phone: '', regNumber: '', specialization: '', experience: '', password: '', confirm: '' })
  const [pharmacyData, setPharmacyData] = useState({
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    password: '',
    confirm: ''
  })
  const specs = ['General Physician', 'Pediatrician', 'Gynaecologist', 'Cardiologist', 'Dermatologist', 'General Medicine']

  const t = selectedLang ? LANGS[selectedLang].ui : LANGS.en.ui

  const inp = { width: '100%', border: '0.5px solid #e8d5bc', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: 'Mukta,sans-serif', background: '#fff', outline: 'none', color: '#1a3a2a', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#0f3d2a', fontFamily: 'Mukta,sans-serif', display: 'block', marginBottom: 6 }
  const btn = { width: '100%', background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: 'Mukta,sans-serif', cursor: 'pointer', marginTop: 8 }
  const gap = { marginBottom: 14 }

  const saveAndNavigate = (data) => {
    localStorage.setItem('gramdoc_token', data.token)
    localStorage.setItem('gramdoc_user', JSON.stringify(data.user))
    localStorage.setItem('gramdoc_lang', selectedLang || 'en')

    const resolvedRole = data.user?.role
    if (resolvedRole === 'doctor') {
      nav('/app/doctor-dashboard')
    } else if (resolvedRole === 'asha') {
      nav('/app/asha-dashboard')
    } else if (resolvedRole === 'pharmacy') {
      nav('/app/pharmacy-dashboard')
    } else {
      nav('/app')
    }
  }

  async function handleSendOtp() {
    const cleanPhone = phone.trim()
    try { 
      const res = await api.sendOtp(cleanPhone, role, name)
      if (res.otp) setReceivedOtp(res.otp)
      toast.success('OTP sent!')
      setStep(2) 
    } catch (err) { 
      toast.error('Failed to send OTP') 
    }
  }

  async function handleResendOtp() {
    if (!phone.trim()) {
      toast.error('Enter mobile number first')
      return
    }
    try {
      const res = await api.sendOtp(phone.trim(), role, name)
      if (res.otp) setReceivedOtp(res.otp)
      toast.success('OTP resent!')
    } catch (err) {
      toast.error('Failed to resend OTP')
    }
  }
  async function handleVerifyOtp() {
    const cleanPhone = phone.trim()
    const cleanOtp = otp.replace(/\s/g, '') // Remove all whitespace
    console.log('Verifying OTP:', { phone: cleanPhone, otp: cleanOtp })
    try { 
      const d = await api.verifyOtp(cleanPhone, cleanOtp)
      saveAndNavigate(d) 
    } catch (err) { 
      console.error('Verification failed:', err.message)
      toast.error(err.message || 'Invalid OTP') 
    }
  }
  async function handleLogin() {
    try {
      if (isSignup) {
        if (!name.trim() || !email.trim() || !password.trim()) {
          toast.error('Please fill name, email and password')
          return
        }
        const d = await api.signup({
          name: name.trim(),
          email: email.trim(),
          password,
          role: 'patient'
        })
        saveAndNavigate(d)
        return
      }

      const d = await api.loginEmail(email.trim(), password)
      saveAndNavigate(d)
    } catch (err) {
      toast.error(err?.message || 'Invalid credentials')
    }
  }

  async function handleDoctorApply() {
    if (!dd.name || !dd.email || !dd.phone || !dd.regNumber || !dd.specialization || !dd.password || !dd.confirm) {
      toast.error('Please complete all doctor application fields')
      return
    }
    if (dd.password !== dd.confirm) {
      toast.error('Password and confirm password do not match')
      return
    }
    try {
      await api.doctorApply(dd)
      nav('/pending')
    } catch (err) {
      toast.error(err?.message || 'Could not submit application. Please try again.')
    }
  }

  async function handlePharmacyLogin() {
    try {
      if (!pharmacyData.email.trim() || !pharmacyData.password.trim()) {
        toast.error('Please enter email and password')
        return
      }
      const d = await api.loginEmail(pharmacyData.email.trim(), pharmacyData.password)
      saveAndNavigate(d)
    } catch (err) {
      toast.error(err?.message || 'Invalid credentials')
    }
  }

  async function handlePharmacyApply() {
    if (!pharmacyData.pharmacyName || !pharmacyData.ownerName || !pharmacyData.email || !pharmacyData.phone || !pharmacyData.address || !pharmacyData.licenseNumber || !pharmacyData.password || !pharmacyData.confirm) {
      toast.error('Please complete all pharmacy registration fields')
      return
    }
    if (pharmacyData.password !== pharmacyData.confirm) {
      toast.error('Password and confirm password do not match')
      return
    }
    try {
      await api.pharmacyApply({
        pharmacyName: pharmacyData.pharmacyName,
        ownerName: pharmacyData.ownerName,
        email: pharmacyData.email.trim(),
        phone: pharmacyData.phone.trim(),
        address: pharmacyData.address,
        licenseNumber: pharmacyData.licenseNumber,
        password: pharmacyData.password
      })
      nav('/pending', { state: { message: 'Application under review' } })
    } catch (err) {
      toast.error(err?.message || 'Could not submit application. Please try again.')
    }
  }

  const handleEmergency = () => {
    window.open('tel:108')
    toast.success('Emergency services contacted!')
  }

  // ── Role Selection Screen (SCREEN 1) ──
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

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
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
              onClick={() => { setRole('doctor'); setSelectedLang('en'); setCurrentScreen('auth'); setIsSignup(false); setDoctorStep(1); setPharmacyIsSignup(false); }}
              style={{
                width: 220, height: 260, background: '#fff', borderRadius: 24, padding: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15,61,42,0.08)', cursor: 'pointer', border: '1px solid #e8d5bc'
              }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>👨‍⚕️</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f3d2a' }}>I am a Doctor</div>
              <div style={{ fontSize: 13, color: '#6b5e50', textAlign: 'center', marginTop: 12 }}>Manage queue and write prescriptions</div>
            </motion.div>

            {/* ASHA Card */}
            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setRole('asha'); setSelectedLang('en'); setCurrentScreen('auth'); setIsSignup(false); setDoctorStep(1); setStep(1); setPharmacyIsSignup(false); }}
              style={{
                width: 220, height: 260, background: '#fff', borderRadius: 24, padding: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(123,63,160,0.08)', cursor: 'pointer', border: '1.5px solid #7B3FA0'
              }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>👩‍⚕️</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#7B3FA0' }}>ASHA Worker</div>
              <div style={{ fontSize: 13, color: '#6b5e50', textAlign: 'center', marginTop: 12 }}>Support village health and track patients</div>
            </motion.div>

            {/* Pharmacy Card */}
            <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setRole('pharmacy'); setSelectedLang('en'); setCurrentScreen('auth'); setIsSignup(false); setDoctorStep(1); setStep(1); setPharmacyIsSignup(false); }}
              style={{
                width: 220, height: 260, background: '#fff', borderRadius: 24, padding: 30,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(45,95,163,0.12)', cursor: 'pointer', border: '1.5px solid #2d5fa3'
              }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>💊</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2d5fa3' }}>Pharmacy</div>
              <div style={{ fontSize: 13, color: '#6b5e50', textAlign: 'center', marginTop: 12 }}>Manage orders and inventory</div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative' }}>
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

  // ── Auth form (after language selected) ──
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'Mukta,sans-serif' }}>

        {/* LEFT PANEL */}
        <div style={{ width: '40%', background: '#0f3d2a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ x: [0, 80, -40, 0], y: [0, 60, 120, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-150px', left: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'rgba(123,202,164,0.08)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 20 }}>
            <div style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 26, color: '#fff', fontWeight: 600 }}>GramDoc</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{t.tagline}</div>
          </div>

          <div style={{ position: 'relative', zIndex: 20 }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 36, color: '#fff', fontWeight: 600, lineHeight: 1.2, marginBottom: 16 }}>
              {t.hero[0]}<br />{t.hero[1]}<br /><span style={{ color: '#7bcaa4' }}>{t.hero[2]}</span>
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 300 }}>{t.subtext}</p>
          </div>

          {/* Language badge + change */}
          <div style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 28 }}>
              {[{ n: '12', l: 'Doctors' }, { n: '342', l: 'Patients' }, { n: '4m', l: 'Avg wait' }].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: 'Fraunces,serif', fontSize: 20, color: '#7bcaa4', fontWeight: 600 }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedLang(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 10, cursor: 'pointer', fontFamily: 'Mukta,sans-serif' }}>
              🌐 {LANGS[selectedLang].native}
            </button>
          </div>

          {/* Lady doctor */}
          <div style={{ position: 'absolute', bottom: -20, right: -40, width: 280, zIndex: 10 }}>
            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} transition={{ duration: 1.2, type: 'spring', stiffness: 45, damping: 12, delay: 0.3 }}>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
                <img src={ladyDoctor} alt="Doctor" style={{ width: '100%', filter: 'drop-shadow(10px 0 20px rgba(0,0,0,0.3))' }} />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, background: '#f7f3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          {/* Back/Language Navigation */}
          <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 50, display: 'flex', gap: 10 }}>
            <button onClick={handleEmergency} style={{ background: '#A32D2D', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
              🚨 Emergency
            </button>
            {role === 'doctor' || role === 'asha' || role === 'pharmacy' ? (
              <button onClick={() => setCurrentScreen('role')} style={{ background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                ← Back
              </button>
            ) : (
              <button onClick={() => setCurrentScreen('language')} style={{ background: '#EAF3DE', color: '#0f3d2a', border: '1px solid #7bcaa4', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                🌐 Change Language
              </button>
            )}
          </div>
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ background: '#fff', borderRadius: 20, border: '0.5px solid #e8d5bc', padding: '36px 40px', width: 420 }}>

            {/* ── PATIENT ── */}
            {role === 'patient' && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 22, color: '#0f3d2a', marginBottom: 4 }}>{isSignup ? t.createAccount : t.welcomeBack}</h3>
                <p style={{ fontSize: 12, color: '#6b5e50', marginBottom: 20 }}>{isSignup ? t.joinFree : t.signInContinue}</p>
                <div style={{ display: 'flex', background: '#f7f3ed', borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 }}>
                  {['phone', 'email'].map(m => (
                    <button key={m} onClick={() => { setMethod(m); setStep(1) }}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Mukta,sans-serif', background: method === m ? '#fff' : 'transparent', color: method === m ? '#0f3d2a' : '#6b5e50' }}>
                      {m === 'phone' ? `📱 ${t.phoneTab}` : `✉️ ${t.emailTab}`}
                    </button>
                  ))}
                </div>
                {method === 'phone' && step === 1 && (
                  <div>
                    <div style={gap}><label style={lbl}>Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ramesh Kumar" style={inp} />
                    </div>
                    <div style={gap}><label style={lbl}>{t.mobileLabel}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ background: '#f7f3ed', border: '0.5px solid #e8d5bc', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f3d2a', flexShrink: 0 }}>+91</div>
                        <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && phone.trim() && name.trim() && handleSendOtp()} placeholder="9876543210" style={inp} />
                      </div>
                    </div>
                    <button onClick={() => phone.trim() && name.trim() && handleSendOtp()} style={btn}>{t.sendOtp}</button>
                  </div>
                )}
                {method === 'phone' && step === 2 && (
                  <div>
                    <p style={{ fontSize: 11, color: '#6b5e50', marginBottom: 14 }}>{t.otpSentTo} +91 {phone} <span onClick={() => setStep(1)} style={{ color: '#0f3d2a', fontWeight: 600, cursor: 'pointer' }}>{t.change}</span></p>
                    {receivedOtp && (
                      <div style={{ background: '#EAF3DE', padding: '10px', borderRadius: 8, border: '1px dashed #0f3d2a', marginBottom: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#0f3d2a', fontWeight: 700, textTransform: 'uppercase' }}>Demo Code</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f3d2a', letterSpacing: 4 }}>{receivedOtp}</div>
                      </div>
                    )}
                    <div style={gap}><label style={lbl}>{t.otpLabel}</label>
                      <input value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === 'Enter' && otp.trim() && handleVerifyOtp()} placeholder="• • • • • •" maxLength={6} style={{ ...inp, letterSpacing: '0.4em', textAlign: 'center', fontSize: 18 }} />
                    </div>
                    <button onClick={() => otp.trim() && handleVerifyOtp()} style={btn}>{t.verifyBtn}</button>
                    <p style={{ textAlign: 'center', fontSize: 11, color: '#6b5e50', marginTop: 12 }}>{t.didntReceive} <span onClick={handleResendOtp} style={{ color: '#0f3d2a', fontWeight: 600, cursor: 'pointer' }}>{t.resendOtp}</span></p>
                  </div>
                )}
                {method === 'email' && (
                  <div>
                    {isSignup && <div style={gap}><label style={lbl}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} /></div>}
                    <div style={gap}><label style={lbl}>{t.emailLabel}</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} /></div>
                    <div style={gap}><label style={lbl}>{t.passwordLabel}</label><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={inp} /></div>
                    <button onClick={handleLogin} style={btn}>{isSignup ? t.createBtn : t.signIn}</button>
                  </div>
                )}
                <div style={{ borderTop: '0.5px solid #e8d5bc', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6b5e50' }}>{isSignup ? t.alreadyHave : t.dontHave}{' '}
                    <span onClick={() => { setIsSignup(!isSignup); setStep(1) }} style={{ color: '#0f3d2a', fontWeight: 600, cursor: 'pointer' }}>{isSignup ? t.signInLink : t.signUpLink}</span>
                  </span>
                </div>
              </div>
            )}

            {/* ── DOCTOR SIGN IN ── */}
            {role === 'doctor' && !isSignup && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 22, color: '#0f3d2a', marginBottom: 4 }}>{t.doctorSignIn}</h3>
                <p style={{ fontSize: 12, color: '#6b5e50', marginBottom: 20 }}>{t.doctorPortal}</p>
                <div style={gap}><label style={lbl}>{t.emailLabel}</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@hospital.com" style={inp} /></div>
                <div style={gap}><label style={lbl}>{t.passwordLabel}</label><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={inp} /></div>
                <button onClick={handleLogin} style={btn}>{t.signIn}</button>
                <div style={{ borderTop: '0.5px solid #e8d5bc', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6b5e50' }}>{t.newDoctor} <span onClick={() => setIsSignup(true)} style={{ color: '#0f3d2a', fontWeight: 600, cursor: 'pointer' }}>{t.applyJoin}</span></span>
                </div>
              </div>
            )}

            {/* ── DOCTOR APPLY ── */}
            {role === 'doctor' && isSignup && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span onClick={() => doctorStep > 1 ? setDoctorStep(doctorStep - 1) : setIsSignup(false)} style={{ cursor: 'pointer', color: '#0f3d2a', fontSize: 18 }}>←</span>
                  <div>
                    <h3 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 20, color: '#0f3d2a' }}>
                      {doctorStep === 1 ? t.personalDetails : doctorStep === 2 ? t.medicalCredentials : t.setPassword}
                    </h3>
                    <p style={{ fontSize: 10, color: '#6b5e50' }}>{t.stepOf} {doctorStep} {t.of} 3</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {[1, 2, 3].map(s => <div key={s} style={{ width: 24, height: 4, borderRadius: 2, background: s <= doctorStep ? '#0f3d2a' : '#e8d5bc' }} />)}
                  </div>
                </div>
                {doctorStep === 1 && (
                  <div>
                    <div style={gap}><label style={lbl}>{t.fullName}</label><input value={dd.name} onChange={e => setDd({ ...dd, name: e.target.value })} placeholder={t.namePlaceholder} style={inp} /></div>
                    <div style={gap}><label style={lbl}>{t.emailLabel}</label><input value={dd.email} onChange={e => setDd({ ...dd, email: e.target.value })} placeholder="doctor@hospital.com" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Phone</label><input value={dd.phone} onChange={e => setDd({ ...dd, phone: e.target.value })} placeholder="9876543210" style={inp} /></div>
                    <div style={gap}><label style={lbl}>{t.yearsExp}</label><input value={dd.experience} onChange={e => setDd({ ...dd, experience: e.target.value })} placeholder={t.expPlaceholder} style={inp} /></div>
                    <button onClick={() => dd.name && dd.email && dd.phone && setDoctorStep(2)} style={btn}>{t.nextBtn}</button>
                  </div>
                )}
                {doctorStep === 2 && (
                  <div>
                    <div style={gap}><label style={lbl}>{t.regNumber}</label><input value={dd.regNumber} onChange={e => setDd({ ...dd, regNumber: e.target.value })} placeholder={t.regPlaceholder} style={inp} /></div>
                    <div style={gap}><label style={lbl}>{t.specialization}</label>
                      <select value={dd.specialization} onChange={e => setDd({ ...dd, specialization: e.target.value })} style={{ ...inp, appearance: 'none' }}>
                        <option value="">{t.selectSpec}</option>
                        {specs.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}><p style={{ fontSize: 11, color: '#3B6D11' }}>📋 {t.verifyNote}</p></div>
                    <button onClick={() => dd.regNumber && dd.specialization && setDoctorStep(3)} style={btn}>{t.nextBtn}</button>
                  </div>
                )}
                {doctorStep === 3 && (
                  <div>
                    <div style={gap}><label style={lbl}>{t.createPass}</label><input value={dd.password} onChange={e => setDd({ ...dd, password: e.target.value })} type="password" placeholder="••••••••" style={inp} /></div>
                    <div style={gap}><label style={lbl}>{t.confirmPass}</label><input value={dd.confirm} onChange={e => setDd({ ...dd, confirm: e.target.value })} type="password" placeholder="••••••••" style={inp} /></div>
                    <button onClick={handleDoctorApply} style={btn}>{t.submitApp}</button>
                  </div>
                )}
              </div>
            )}
            
            {/* ── ASHA LOGIN ── */}
            {role === 'asha' && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 22, color: '#7B3FA0', marginBottom: 4 }}>ASHA Worker Login</h3>
                <p style={{ fontSize: 12, color: '#6b5e50', marginBottom: 20 }}>Access your village health dashboard</p>

                {step === 1 ? (
                  <div>
                    <div style={gap}><label style={lbl}>Your Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sunita Devi" style={inp} />
                    </div>
                    <div style={gap}><label style={lbl}>Enter your registered ASHA mobile number</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ background: '#f7f3ed', border: '0.5px solid #e8d5bc', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f3d2a', flexShrink: 0 }}>+91</div>
                        <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && phone.trim() && name.trim() && handleSendOtp()} placeholder="9876543210" style={inp} />
                      </div>
                    </div>
                    <button onClick={() => phone.trim() && name.trim() && handleSendOtp()} style={{ ...btn, background: '#7B3FA0' }}>{t.sendOtp}</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 11, color: '#6b5e50', marginBottom: 14 }}>{t.otpSentTo} +91 {phone} <span onClick={() => setStep(1)} style={{ color: '#7B3FA0', fontWeight: 600, cursor: 'pointer' }}>{t.change}</span></p>
                    
                    {/* Demo Mode: Show OTP */}
                    {receivedOtp && (
                      <div style={{ background: '#F3E8FF', padding: '10px', borderRadius: 8, border: '1px dashed #7B3FA0', marginBottom: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#7B3FA0', fontWeight: 700, textTransform: 'uppercase' }}>Demo Code</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#7B3FA0', letterSpacing: 4 }}>{receivedOtp}</div>
                      </div>
                    )}

                    <div style={gap}><label style={lbl}>{t.otpLabel}</label>
                      <input 
                        value={otp} 
                        onChange={e => setOtp(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && otp.trim() && handleVerifyOtp()} 
                        placeholder="123456" 
                        style={{ ...inp, letterSpacing: '0.4em', textAlign: 'center', fontSize: 18, fontWeight: 700 }} 
                      />
                    </div>
                    <button onClick={() => otp.trim() && handleVerifyOtp()} style={{ ...btn, background: '#7B3FA0' }}>{t.verifyBtn}</button>
                  </div>
                )}
              </div>
            )}

            {/* ── PHARMACY ── */}
            {role === 'pharmacy' && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 22, color: '#2d5fa3', marginBottom: 4 }}>Pharmacy Portal</h3>
                <p style={{ fontSize: 12, color: '#6b5e50', marginBottom: 20 }}>Manage prescriptions and fulfill orders</p>

                {!pharmacyIsSignup ? (
                  <div>
                    <div style={gap}><label style={lbl}>Email</label><input value={pharmacyData.email} onChange={e => setPharmacyData({ ...pharmacyData, email: e.target.value })} placeholder="pharmacy@example.com" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Password</label><input value={pharmacyData.password} onChange={e => setPharmacyData({ ...pharmacyData, password: e.target.value })} type="password" placeholder="••••••••" style={inp} /></div>
                    <button onClick={handlePharmacyLogin} style={{ ...btn, background: '#2d5fa3' }}>Sign In</button>
                    <div style={{ borderTop: '0.5px solid #e8d5bc', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6b5e50' }}>New pharmacy?{' '}
                        <span onClick={() => setPharmacyIsSignup(true)} style={{ color: '#2d5fa3', fontWeight: 600, cursor: 'pointer' }}>Register here</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={gap}><label style={lbl}>Pharmacy Name</label><input value={pharmacyData.pharmacyName} onChange={e => setPharmacyData({ ...pharmacyData, pharmacyName: e.target.value })} placeholder="HealthPlus Pharmacy" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Owner Name</label><input value={pharmacyData.ownerName} onChange={e => setPharmacyData({ ...pharmacyData, ownerName: e.target.value })} placeholder="Owner full name" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Email</label><input value={pharmacyData.email} onChange={e => setPharmacyData({ ...pharmacyData, email: e.target.value })} placeholder="pharmacy@example.com" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Phone</label><input value={pharmacyData.phone} onChange={e => setPharmacyData({ ...pharmacyData, phone: e.target.value })} placeholder="9876543210" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Address</label><input value={pharmacyData.address} onChange={e => setPharmacyData({ ...pharmacyData, address: e.target.value })} placeholder="Full address" style={inp} /></div>
                    <div style={gap}><label style={lbl}>License Number</label><input value={pharmacyData.licenseNumber} onChange={e => setPharmacyData({ ...pharmacyData, licenseNumber: e.target.value })} placeholder="DL-XXXX-0000" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Password</label><input value={pharmacyData.password} onChange={e => setPharmacyData({ ...pharmacyData, password: e.target.value })} type="password" placeholder="••••••••" style={inp} /></div>
                    <div style={gap}><label style={lbl}>Confirm Password</label><input value={pharmacyData.confirm} onChange={e => setPharmacyData({ ...pharmacyData, confirm: e.target.value })} type="password" placeholder="••••••••" style={inp} /></div>
                    <button onClick={handlePharmacyApply} style={{ ...btn, background: '#2d5fa3' }}>Submit Application</button>
                    <div style={{ borderTop: '0.5px solid #e8d5bc', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6b5e50' }}>Already registered?{' '}
                        <span onClick={() => setPharmacyIsSignup(false)} style={{ color: '#2d5fa3', fontWeight: 600, cursor: 'pointer' }}>Sign in</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
