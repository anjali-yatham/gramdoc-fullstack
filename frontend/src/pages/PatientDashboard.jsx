import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, safeParse } from '../utils/api'
import toast from 'react-hot-toast'
import doctorGreeting from '../assets/doctor_masked.png'
import { LANGS, getT } from '../utils/translations'

// --- Animated Background Component ---
const Background = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
    {/* Orbs */}
    <motion.div
      animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '-10%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(123,202,164,0.15)', filter: 'blur(80px)' }}
    />
    <motion.div
      animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '-5%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(196,101,58,0.1)', filter: 'blur(70px)' }}
    />
    <motion.div
      animate={{ x: [0, 50, 0], y: [0, -70, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(15,61,42,0.08)', filter: 'blur(60px)' }}
    />
    <motion.div
      animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(232,213,188,0.25)', filter: 'blur(50px)' }}
    />
    <motion.div
      animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '30%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(123,202,164,0.1)', filter: 'blur(60px)' }}
    />

    {/* Dot Grid */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
      <defs>
        <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(15,61,42,0.4)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGrid)" />
    </svg>
  </div>
)

export default function PatientDashboard() {
  const navigate = useNavigate()
  const user = api.getUser() || {}
  const lang = localStorage.getItem('gramdoc_lang') || 'en'
  const t = getT(lang)

  const [history, setHistory] = useState([])
  const [medicines, setMedicines] = useState([])
  const [takenMeds, setTakenMeds] = useState({})
  const [ambulanceStopped, setAmbulanceStopped] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [upcomingConsultation, setUpcomingConsultation] = useState(null)
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const deferredPromptRef = useRef(null)
  const triageData = safeParse(localStorage.getItem('gd_triage'), null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const storedHistory = safeParse(localStorage.getItem('gd_prescription_history'), [])
    const myName = (user?.name || '').toLowerCase().trim()
    const myHistory = storedHistory.filter(rx => {
      const rxName = (rx.patientName || '').toLowerCase().trim()
      return rxName === myName || rxName.includes(myName) || myName.includes(rxName)
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    
    setHistory(myHistory)
    if (myHistory.length > 0) {
      setMedicines(myHistory[0].medicines || [])
    }

    // ALGORITHM: Find soonest upcoming follow-up or booked appointment
    const now = new Date()
    now.setHours(0,0,0,0)

    // 1. Check Follow-ups from prescriptions
    const followUps = myHistory
      .filter(rx => rx.followUpDate && new Date(rx.followUpDate) >= now)
      .map(rx => ({
        type: 'follow-up',
        date: rx.followUpDate,
        doctorName: rx.doctorName || rx.doctor?.name || 'Doctor',
        id: rx._id
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // 2. Check Booked Appointments
    const booked = safeParse(localStorage.getItem('gd_booked_appointment'), null)
    if (booked && new Date(booked.date) >= now) {
      followUps.push({
        type: 'booked',
        date: booked.date,
        time: booked.time || '10:00 AM',
        doctorName: booked.doctorName,
        id: 'booked'
      })
    }

    // Sort combined and take the soonest
    const finalUpcoming = followUps.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
    setUpcomingConsultation(finalUpcoming)
    
    // Load taken status for today
    const todayStr = new Date().toDateString()
    const storedTaken = safeParse(localStorage.getItem('gd_taken_meds'), {})
    if (storedTaken.date === todayStr) {
      setTakenMeds(storedTaken.meds || {})
    } else {
      localStorage.setItem('gd_taken_meds', JSON.stringify({ date: todayStr, meds: {} }))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const today = new Date().toDateString()
    const dismissed = localStorage.getItem('gd_alert_dismissed')
    setAlertDismissed(dismissed === today)

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const installDismissed = localStorage.getItem('gd_install_dismissed') === 'true'
    if (!isStandalone && !installDismissed && user?.role === 'patient') {
      setShowInstallBanner(false)
    }

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      if (!isStandalone && !installDismissed && user?.role === 'patient') {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [user?.role])

  useEffect(() => {
    api.getDoctors({ available: true })
      .then((docs) => setAvailableDoctors(Array.isArray(docs) ? docs : []))
      .catch(() => setAvailableDoctors([]))
  }, [])

  const toggleMed = (name) => {
    const today = new Date().toDateString()
    const newTaken = { ...takenMeds, [name]: !takenMeds[name] }
    setTakenMeds(newTaken)
    localStorage.setItem('gd_taken_meds', JSON.stringify({ date: today, meds: newTaken }))
    if (!takenMeds[name]) toast.success('Medicine marked as taken!')
  }

  const latestRx = history[0]
  const now = new Date()

  const formatShortDate = (dateValue) => {
    if (!dateValue) return 'Not scheduled'
    const dt = new Date(dateValue)
    if (Number.isNaN(dt.getTime())) return 'Not scheduled'
    return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const daysAgoText = (dateValue) => {
    if (!dateValue) return 'No prescriptions'
    const dt = new Date(dateValue)
    if (Number.isNaN(dt.getTime())) return 'No prescriptions'
    const diff = Math.max(0, Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)))
    if (diff === 0) return 'Today'
    if (diff === 1) return '1 day ago'
    return `${diff} days ago`
  }

  const currentSlot = (() => {
    const hour = now.getHours()
    if (hour < 12) return 'Morning'
    if (hour < 18) return 'Afternoon'
    return 'Night'
  })()

  const getTakenKey = (index) => `gd_medicine_taken_${now.toDateString()}_${index}`

  const medName = (med) => {
    if (!med) return ''
    if (typeof med === 'string') return med
    return med.name || med.medicine || med.drug || ''
  }

  const medTiming = (med) => {
    if (!med || typeof med === 'string') return ''
    return med.timing || med.schedule || med.time || ''
  }

  const installApp = async () => {
    if (!deferredPromptRef.current) return
    deferredPromptRef.current.prompt()
    deferredPromptRef.current = null
    setShowInstallBanner(false)
  }

  const greetings = {
    en: "Namaste 🙏",
    hi: "नमस्ते 🙏",
    te: "నమస్కారం 🙏"
  }

  const greetingText = t.greeting || greetings[lang] || greetings.en

  const emergencyLabels = {
    en: { title: "Emergency Help", sub: "108", bar: "In case of emergency" },
    hi: { title: "आपातकालीन सहायता", sub: "108", bar: "आपातकाल में" },
    te: { title: "అత్యవసర సహాయం", sub: "108", bar: "అత్యవసర సహాయం కోసం" }
  }

  const mainAction = {
    en: { title: "Talk to a Doctor", sub: "Tell us your problem right now", btn: "Speak Now" },
    hi: { title: "डॉक्टर से बात करें", sub: "अभी अपनी समस्या बताएं", btn: "बोलिए" },
    te: { title: "డాక్టర్తో మాట్లాడండి", sub: "ఇప్పుడే మీ సమస్య చెప్పండి", btn: "మాట్లాడండి" }
  }

  const mainActionText = {
    title: t.talkToDoctor || mainAction[lang]?.title || mainAction.en.title,
    sub: t.symptoms || mainAction[lang]?.sub || mainAction.en.sub,
    btn: t.speak || mainAction[lang]?.btn || mainAction.en.btn
  }

  const tiles = [
    {
      id: 'triage',
      emoji: '🤖',
      accent: '#7bcaa4',
      title: { en: "AI Health Check", hi: "AI से बात करें", te: "AI తో మాట్లాడండి" },
      sub: { en: "Describe symptoms", hi: "लक्षण बताएं", te: "మీ లక్షణాలు చెప్పండి" },
      to: '/app/voice-triage'
    },
    {
      id: 'doctors',
      emoji: '👨‍⚕️',
      accent: '#c4653a',
      title: { en: "Find a Doctor", hi: "डॉक्टर खोजें", te: "డాక్టర్ను కలవండి" },
      sub: { en: "See available doctors", hi: "उपलब्ध डॉक्टर देखें", te: "అందుబాటులో ఉన్న డాక్టర్లు" },
      to: '/app/doctors'
    },
    {
      id: 'medicines',
      emoji: '💊',
      accent: '#e8d5bc',
      title: { en: "My Medicines", hi: "मेरी दवाइयां", te: "నా మందులు" },
      sub: { en: "Doctor prescribed", hi: "डॉक्टर की दवाइयां", te: "డాక్టర్ ఇచ్చిన మందులు" },
      to: '/app/prescriptions'
    },
    {
      id: 'profile',
      emoji: '👤',
      accent: '#0f3d2a',
      title: { en: "My Profile", hi: "मेरी जानकारी", te: "నా వివరాలు" },
      sub: { en: "Personal information", hi: "व्यक्तिगत जानकारी", te: "వ్యక్తిగత సమాచారం" },
      to: '/app/patient-profile'
    }
  ]

  const glassStyle = {
    backdropFilter: 'blur(12px)',
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(255,255,255,0.9)',
    borderRadius: '20px',
    padding: '24px',
    position: 'relative',
    zIndex: 10
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '24px', background: '#fdf6ec', fontFamily: 'Mukta, sans-serif' }}>
      <Background />

      {/* Offline Banner */}
      {!isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: '#FEF3C7', border: '1px solid #F59E0B', 
            padding: '12px 20px', borderRadius: 12, color: '#92400E', 
            fontSize: '13px', fontWeight: 600, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 100
          }}
        >
          <span>📶</span>
          You are offline. Your symptoms will be saved and sent when internet returns.
        </motion.div>
      )}

      {/* SECTION 1 — GREETING CARD */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{ ...glassStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}
      >
        <div style={{ position: 'relative', height: '180px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Doctor Illustration - Masked to remove background */}
          <div style={{ 
            width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden',
            border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            background: '#fff', position: 'relative', zIndex: 1, flexShrink: 0
          }}>
            <img 
              src={doctorGreeting} 
              alt="Doctor" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} 
            />
          </div>

          {/* The Board held by doctor */}
          <motion.div 
            initial={{ x: -10, opacity: 0, rotate: -1 }}
            animate={{ x: 0, opacity: 1, rotate: -1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            style={{
              background: '#fff', padding: '20px 28px', borderRadius: '16px',
              border: '2px solid #0f3d2a', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              zIndex: 10, marginLeft: '-40px', marginTop: '20px',
              minWidth: '240px', position: 'relative'
            }}
          >
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '15px', color: '#7bcaa4', marginBottom: '4px' }}>
              {greetingText}
            </div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '32px', color: '#0f3d2a', fontWeight: 700, lineHeight: 1.1 }}>
              {user.name || 'Patient'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b5e50', marginTop: '8px', borderTop: '1px solid #fdf6ec', paddingTop: '6px' }}>
              {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'te-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* SECTION 2 — MAIN ACTION BUTTON */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, #0f3d2a, #1d5c3a)', borderRadius: '24px', padding: '32px', marginBottom: '20px',
          position: 'relative', overflow: 'hidden', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 12px 32px rgba(15,61,42,0.2)'
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'rgba(123,202,164,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(123,202,164,0.08)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🩺</div>
          <h2 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '36px', color: 'white', lineHeight: 1.1, margin: 0 }}>
            {mainActionText.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '8px', margin: 0 }}>
            {mainActionText.sub}
          </p>
        </div>

        <motion.button
          onClick={() => navigate('/app/voice-triage')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
          style={{
            background: '#7bcaa4', color: '#0f3d2a', borderRadius: '20px', padding: '20px 32px', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2
          }}
        >
          <span style={{ fontSize: '32px', marginBottom: '4px' }}>🎤</span>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '18px', fontWeight: 700 }}>
            {mainActionText.btn}
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>→</div>
        </motion.button>
      </motion.div>

      {/* ADDITION 1 — Health Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/app/prescriptions')}
          style={{ ...glassStyle, cursor: 'pointer', padding: '18px' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d9f3e7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>💊</div>
          <div style={{ fontSize: 11, color: '#8a7e71', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Medicines</div>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 26, color: '#0f3d2a', marginTop: 4 }}>{(latestRx?.medicines?.length || 0)} medicines</div>
          <div style={{ fontSize: 11, color: '#9e9388', marginTop: 4 }}>from last prescription</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/app/prescriptions')}
          style={{ ...glassStyle, cursor: 'pointer', padding: '18px' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e4efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 11, color: '#8a7e71', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Follow-up</div>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 26, color: '#0f3d2a', marginTop: 4 }}>{formatShortDate(latestRx?.followUpDate)}</div>
          <div style={{ fontSize: 11, color: '#9e9388', marginTop: 4 }}>{latestRx?.doctorName || latestRx?.doctor?.name || 'No doctor info'}</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => navigate('/app/prescriptions')}
          style={{ ...glassStyle, cursor: 'pointer', padding: '18px' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f2e2d7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 11, color: '#8a7e71', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Prescription</div>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 26, color: '#0f3d2a', marginTop: 4 }}>{daysAgoText(latestRx?.createdAt)}</div>
          <div style={{ fontSize: 11, color: '#9e9388', marginTop: 4 }}>{latestRx?.doctor?.specialization || latestRx?.specialization || 'General Medicine'}</div>
        </motion.div>
      </div>

      {/* ADDITION 2 — Medicine Reminders */}
      <div style={{ ...glassStyle, marginBottom: '20px', borderLeft: '4px solid #0f3d2a', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a' }}>💊 Today&apos;s Medicines</div>
          <div style={{ fontSize: 11, color: '#8a7e71' }}>{now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>

        {!latestRx || !Array.isArray(latestRx.medicines) || latestRx.medicines.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b5e50', lineHeight: 1.5 }}>
            No active medicines. Medicines from your prescription will appear here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {latestRx.medicines.slice(0, 3).map((med, index) => {
              const name = medName(med) || `Medicine ${index + 1}`
              const timing = medTiming(med) || currentSlot
              const taken = localStorage.getItem(getTakenKey(index)) === 'true'
              const dueNow = !taken && timing.toLowerCase().includes(currentSlot.toLowerCase())
              const statusLabel = taken ? '✓ Taken' : dueNow ? '⏰ Due Now' : '○ Pending'
              const statusBg = taken ? '#d8f1e6' : dueNow ? '#fde7bf' : '#efefef'
              const statusColor = taken ? '#157a58' : dueNow ? '#995d00' : '#6f6f6f'

              return (
                <div key={`${name}-${index}`} style={{ background: '#fff', border: '1px solid #ecdcc6', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f3d2a', fontSize: 13 }}>{name}</div>
                    <div style={{ display: 'inline-flex', marginTop: 6, fontSize: 10, background: '#f5efe6', borderRadius: 999, padding: '2px 8px', color: '#6b5e50', fontWeight: 700 }}>{timing}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: statusColor, background: statusBg, borderRadius: 999, padding: dueNow ? '5px 9px' : '4px 9px', animation: dueNow ? 'pulseDue 1.5s ease-in-out infinite' : 'none' }}>
                      {statusLabel}
                    </div>
                    <button
                      onClick={() => {
                        const key = getTakenKey(index)
                        const isTaken = localStorage.getItem(key) === 'true'
                        if (isTaken) localStorage.removeItem(key)
                        else localStorage.setItem(key, 'true')
                        setTakenMeds(prev => ({ ...prev, [name]: !isTaken }))
                      }}
                      style={{ border: 'none', background: '#0f3d2a', color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '7px 10px', cursor: 'pointer' }}
                    >
                      {taken ? 'Undo' : 'Mark Taken'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ADDITION 3 — Village Health Alert */}
      {!alertDismissed && (
        <div style={{ background: '#FEF3CD', border: '1px solid #f0d98c', borderRadius: 14, padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ color: '#b97700', fontWeight: 800, fontSize: 15 }}>🚨 Health Alert</div>
            <div style={{ fontSize: 12, color: '#6b5e50', marginTop: 2 }}>{user?.village || 'Your village'}</div>
            <div style={{ fontSize: 13, color: '#735624', marginTop: 8, lineHeight: 1.5 }}>
              Dengue cases rising this week. Use mosquito nets. Check for fever and joint pain early.
            </div>
            <div style={{ fontSize: 11, color: '#8f7a53', marginTop: 8 }}>— Telangana Health Dept • Today</div>
          </div>
          <button
            onClick={() => {
              setAlertDismissed(true)
              localStorage.setItem('gd_alert_dismissed', new Date().toDateString())
            }}
            style={{ border: 'none', background: 'transparent', color: '#7f5f21', fontSize: 18, cursor: 'pointer', alignSelf: 'flex-start' }}
            aria-label="Dismiss health alert"
          >
            ×
          </button>
        </div>
      )}

      {/* ADDITION 4 — PWA Install Banner */}
      {showInstallBanner && user?.role === 'patient' && (
        <div style={{ background: '#0f3d2a', borderRadius: 12, padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>📱 Install GramDoc on your phone</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Access offline, get medicine reminders</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={installApp} style={{ border: '1px solid rgba(255,255,255,0.8)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Install
            </button>
            <button
              onClick={() => {
                localStorage.setItem('gd_install_dismissed', 'true')
                setShowInstallBanner(false)
              }}
              style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 16, cursor: 'pointer' }}
              aria-label="Dismiss install banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}


      {/* SECTION 2.5 — RECENT TRIAGE SUMMARY (if exists) */}
      <AnimatePresence>
        {triageData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ ...glassStyle, marginBottom: '20px', borderLeft: `6px solid ${triageData.urgency === 'HIGH' ? '#A32D2D' : '#f59e0b'}`, padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7bcaa4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent AI Health Summary</div>
                <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '18px', color: '#0f3d2a', marginTop: '2px' }}>
                  {triageData.doctor || 'Doctor'} recommended
                </div>
              </div>
              <div style={{ background: triageData.urgency === 'HIGH' ? '#A32D2D' : '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                {(triageData.urgency || 'MEDIUM').toUpperCase()} PRIORITY
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#6b5e50', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{triageData.summary || 'No summary available.'}"
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {(Array.isArray(triageData.symptoms)
                ? triageData.symptoms
                : (triageData.symptoms?.split(',') || [])
              ).map(s => (
                <span key={s} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#e8f5ee', color: '#0f3d2a' }}>{s.trim()}</span>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 3 — FOUR QUICK TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.08) }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(tile.to)}
            style={{ ...glassStyle, borderTop: `4px solid ${tile.accent}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 12px' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tile.emoji}</div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '16px', color: '#0f3d2a', fontWeight: 600 }}>
              {tile.title[lang] || tile.title.en}
            </div>
            <div style={{ fontSize: '11px', color: '#6b5e50', marginTop: '2px' }}>
              {tile.sub[lang] || tile.sub.en}
            </div>
          </motion.div>
        ))}
      </div>

      {/* SECTION 3.5 — HEALTH CALENDAR & NEXT APPOINTMENT */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ ...glassStyle, background: 'linear-gradient(135deg, #fdf6ec, #f7f3ed)', border: '1px solid #7bcaa4', marginBottom: '20px', padding: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7bcaa4', textTransform: 'uppercase' }}>Health Calendar</div>
              <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a' }}>Upcoming Consultations</div>
            </div>
          </div>
        </div>

        {upcomingConsultation ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(123,202,164,0.3)' }}>
            <div style={{ width: 50, height: 60, background: '#0f3d2a', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{new Date(upcomingConsultation.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{new Date(upcomingConsultation.date).getDate()}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>
                {upcomingConsultation.type === 'booked' ? 'Booked Appointment' : 'Follow-up Consultation'}
              </div>
              <div style={{ fontSize: 12, color: '#6b5e50' }}>With {upcomingConsultation.doctorName}</div>
              <div style={{ fontSize: 11, color: '#7bcaa4', fontWeight: 600, marginTop: 4 }}>
                {upcomingConsultation.type === 'booked' ? `At ${upcomingConsultation.time}` : 'Scheduled via Prescription'}
              </div>
            </div>
            <button onClick={() => navigate('/app/doctors')} style={{ background: '#7bcaa4', color: '#0f3d2a', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reschedule</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', border: '1.5px dashed #e8d5bc', borderRadius: 16 }}>
            <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic' }}>No follow-up consultations scheduled.</div>
            <button onClick={() => navigate('/app/doctors')} style={{ marginTop: 12, background: 'transparent', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Book a Checkup</button>
          </div>
        )}
      </motion.div>

      {/* SECTION 4 — HEALTH SUMMARY CARD */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Last Consultation */}
        <div style={{ ...glassStyle, padding: '20px' }}>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '15px', color: '#0f3d2a', marginBottom: '16px' }}>
            {lang === 'te' ? "చివరి సంప్రదింపు" : lang === 'hi' ? "पिछली बार" : "Last Consultation"}
          </div>
          {latestRx ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f3d2a' }}>{latestRx.doctorName}</div>
              <div style={{ fontSize: '12px', color: '#6b5e50' }}>{latestRx.date}</div>
              <div style={{ fontSize: '12px', color: '#6b5e50', margin: '4px 0' }}>{latestRx.diagnosis}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '10px', background: '#7bcaa4', color: '#0f3d2a', padding: '2px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {latestRx.medicines?.length || 0} medicines
                </span>
                <span onClick={() => navigate('/app/prescriptions')} style={{ color: '#7bcaa4', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View →</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💊</div>
              <div style={{ fontSize: '13px', color: '#6b5e50', fontStyle: 'italic' }}>No consultations yet</div>
              <div style={{ fontSize: '11px', color: '#6b5e50' }}>Talk to a doctor to get started</div>
            </div>
          )}
        </div>

        {/* Available Doctors Now */}
        <div style={{ ...glassStyle, padding: '20px' }}>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '15px', color: '#0f3d2a', marginBottom: '16px' }}>
            {lang === 'te' ? "అందుబాటులో ఉన్న డాక్టర్లు" : lang === 'hi' ? "अभी उपलब्ध डॉक्टर" : "Doctors Available Now"}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {availableDoctors.slice(0, 3).map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: '#0f3d2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, border: '1px solid #e8d5bc' }}>
                  {(doc.name || 'D').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f3d2a' }}>{doc.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b5e50' }}>{doc.specialization || doc.specialty || 'General Physician'}</div>
                </div>
                <div style={{ background: '#7bcaa4', color: '#0f3d2a', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0f3d2a' }} />
                  {doc.estimatedWait || 'Available'}
                </div>
              </div>
            ))}
            {availableDoctors.length === 0 && (
              <div style={{ fontSize: 12, color: '#6b5e50', fontStyle: 'italic' }}>No doctors are available right now.</div>
            )}
          </div>
          <div onClick={() => navigate('/app/doctors')} style={{ color: '#7bcaa4', fontSize: '12px', fontWeight: 600, marginTop: '14px', textAlign: 'center', cursor: 'pointer' }}>
            See all doctors →
          </div>
        </div>
      </div>

      {/* SECTION 6 — BOTTOM EMERGENCY BAR */}
      <div
        style={{
          position: 'fixed', bottom: '20px', left: 0, right: 0,
          height: '160px', background: 'transparent', border: 'none',
          zIndex: 999, overflow: 'visible', pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end'
        }}
      >
        <motion.div
          initial={{ x: -600 }}
          animate={ambulanceStopped
            ? { x: '50%' }
            : { x: [-600, typeof window !== 'undefined' ? window.innerWidth + 600 : 2600] }
          }
          transition={ambulanceStopped
            ? { type: 'spring', stiffness: 100, damping: 20 }
            : { duration: 10, repeat: Infinity, ease: 'linear', repeatType: 'loop' }
          }
          onClick={() => {
            if (ambulanceStopped) {
              window.open('tel:108')
              setAmbulanceStopped(false)
            } else {
              setAmbulanceStopped(true)
              setTimeout(() => setAmbulanceStopped(false), 5000)
            }
          }}
          style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          {/* ELEMENT 3 — Banner hanging from string */}
          <div style={{ position: 'relative' }}>
            <AnimatePresence>
              {ambulanceStopped && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ type: 'spring' }}
                  style={{
                    position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
                    width: '240px', background: 'white', borderRadius: '12px', padding: '12px 16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px',
                    zIndex: 110, pointerEvents: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span style={{ color: '#0f3d2a', fontSize: '13px', fontWeight: 600 }}>Call emergency services?</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open('tel:108'); setAmbulanceStopped(false); }}
                      style={{ background: '#A32D2D', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', border: 'none', cursor: 'pointer', flex: 1, whiteSpace: 'nowrap' }}
                    >
                      📞 Call 108
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAmbulanceStopped(false); }}
                      style={{ background: '#f7f3ed', color: '#6b5e50', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                rotate: [-2, 2, -2],
                boxShadow: ambulanceStopped
                  ? ['0 0 0 0px rgba(163,45,45,0.4)', '0 0 0 20px rgba(163,45,45,0)', '0 0 0 0px rgba(163,45,45,0.4)']
                  : '0 4px 16px rgba(0,0,0,0.3)'
              }}
              transition={{
                rotate: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                boxShadow: { duration: 1, repeat: Infinity }
              }}
              style={{
                background: 'rgba(163,45,45,0.92)', backdropFilter: 'blur(8px)',
                borderRadius: '12px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px',
                transformOrigin: 'top center'
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444' }}
              />
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 600, fontFamily: 'Mukta' }}>
                అత్యవసరం • आपातकाल • Emergency
              </span>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', height: '16px' }} />
              <span style={{ color: 'white', fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '18px', fontWeight: 700 }}>
                108
              </span>
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.35)' }}
                onClick={() => window.open('tel:108')}
                style={{
                  background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px',
                  color: 'white', fontSize: '10px', cursor: 'pointer', pointerEvents: 'auto', border: 'none',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <span style={{ fontSize: '10px' }}>📞</span> Call
              </motion.button>
            </motion.div>
          </div>

          {/* ELEMENT 2 — String/rope */}
          <div style={{
            width: '40px', height: '2px', background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))',
            borderRadius: '1px', alignSelf: 'center', marginTop: '-8px'
          }} />

          {/* ELEMENT 4 — Exhaust puffs */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div animate={{ opacity: [0.6, 0, 0.6] }} transition={{ duration: 0.8, delay: 0, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', marginRight: '-2px' }} />
            <motion.div animate={{ opacity: [0.4, 0, 0.4] }} transition={{ duration: 0.8, delay: 0.2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', marginRight: '-2px' }} />
            <motion.div animate={{ opacity: [0.2, 0, 0.2] }} transition={{ duration: 0.8, delay: 0.4, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          </div>

          {/* ELEMENT 1 — Ambulance (Flipped) */}
          <motion.div
            animate={{ filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '40px', lineHeight: 1, transform: 'scaleX(-1)', display: 'inline-block' }}
          >
            🚑
          </motion.div>



        </motion.div>
      </div>
    </div>
  )
}
