import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, dualSave, dualLoad, safeParse } from '../utils/api'
import toast from 'react-hot-toast'

const COLORS = {
  forest: '#0f3d2a',
  mint: '#7bcaa4',
  mintLight: '#e8f5ee',
  terracotta: '#c4653a',
  cream: '#fdf6ec',
  sandstone: '#e8d5bc',
  warmGray: '#6b5e50',
  success: '#1d9e75',
  critical: '#A32D2D',
  amber: '#854F0B',
  whiteGlass: 'rgba(255, 255, 255, 0.75)',
  whiteGlassHigh: 'rgba(255, 255, 255, 0.85)',
}

const FONTS = {
  display: 'Fraunces, serif',
  body: 'Mukta, sans-serif',
}


// --- HELPER COMPONENTS ---

const AnimatedBackground = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {/* CHILD 1 — Base gradient layer */}
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fdf6ec 0%, #f0f7f3 25%, #fdf6ec 50%, #f5f0ea 75%, #eef5f1 100%)' }} />

    {/* CHILD 2 — Animated orb 1 (large mint) */}
    <motion.div
      style={{ width: 800, height: 800, borderRadius: '50%', position: 'absolute', top: '-200px', left: '-200px', background: 'radial-gradient(circle, rgba(123,202,164,0.2) 0%, rgba(123,202,164,0.05) 50%, transparent 70%)' }}
      animate={{ x: [0, 150, 80, 0], y: [0, 100, 200, 0] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
    />

    {/* CHILD 3 — Animated orb 2 (terracotta) */}
    <motion.div
      style={{ width: 600, height: 600, borderRadius: '50%', position: 'absolute', top: '10%', right: '-150px', background: 'radial-gradient(circle, rgba(196,101,58,0.12) 0%, rgba(196,101,58,0.03) 50%, transparent 70%)' }}
      animate={{ x: [0, -120, -60, 0], y: [0, 150, 80, 0] }}
      transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
    />

    {/* CHILD 4 — Animated orb 3 (forest deep) */}
    <motion.div
      style={{ width: 700, height: 700, borderRadius: '50%', position: 'absolute', bottom: '-200px', left: '30%', background: 'radial-gradient(circle, rgba(15,61,42,0.1) 0%, rgba(15,61,42,0.03) 50%, transparent 70%)' }}
      animate={{ x: [0, -100, 60, 0], y: [0, -120, -60, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    />

    {/* CHILD 5 — Animated orb 4 (mint bottom right) */}
    <motion.div
      style={{ width: 500, height: 500, borderRadius: '50%', position: 'absolute', bottom: '5%', right: '5%', background: 'radial-gradient(circle, rgba(123,202,164,0.15) 0%, transparent 70%)' }}
      animate={{ x: [0, 80, -40, 0], y: [0, -100, 40, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />

    {/* CHILD 6 — Animated orb 5 (sandstone warm) */}
    <motion.div
      style={{ width: 400, height: 400, borderRadius: '50%', position: 'absolute', top: '40%', left: '40%', background: 'radial-gradient(circle, rgba(232,213,188,0.3) 0%, transparent 70%)' }}
      animate={{ x: [0, 60, -80, 0], y: [0, 80, -40, 0] }}
      transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
    />

    {/* CHILD 7 — SVG dot grid pattern */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}>
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="rgba(15,61,42,0.07)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>

    {/* CHILD 8 — Diagonal animated light beam */}
    <motion.div
      style={{ position: 'absolute', width: '3px', height: '150%', top: '-25%', left: '55%', background: 'linear-gradient(to bottom, transparent 0%, rgba(123,202,164,0.2) 30%, rgba(123,202,164,0.3) 50%, rgba(123,202,164,0.2) 70%, transparent 100%)', transform: 'rotate(20deg)', transformOrigin: 'center' }}
      animate={{ opacity: [0.2, 0.6, 0.2], x: [0, 30, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* CHILD 9 — Floating sparkle particles */}
    {[
      { top: '8%', left: '12%', width: 6, y: [0, -25, 0], dur: 4, del: 0 },
      { top: '20%', left: '75%', width: 4, y: [0, -20, 0], dur: 5, del: 0.8 },
      { top: '45%', left: '8%', width: 8, y: [0, -30, 0], dur: 6, del: 1.5 },
      { top: '65%', left: '85%', width: 5, y: [0, -22, 0], dur: 4.5, del: 0.3 },
      { top: '78%', left: '35%', width: 7, y: [0, -28, 0], dur: 5.5, del: 2 },
      { top: '30%', left: '50%', width: 4, y: [0, -18, 0], dur: 3.5, del: 1 },
      { top: '55%', left: '65%', width: 6, y: [0, -24, 0], dur: 4.8, del: 0.6 },
      { top: '88%', left: '20%', width: 5, y: [0, -20, 0], dur: 5.2, del: 1.8 }
    ].map((p, i) => (
      <motion.div
        key={i}
        style={{ position: 'absolute', top: p.top, left: p.left, width: p.width, height: p.width, borderRadius: '50%', background: 'rgba(123,202,164,0.4)' }}
        animate={{ y: p.y, opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
)

const LiveIndicator = ({ online }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 10 }}>
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{ width: 6, height: 6, borderRadius: '50%', background: online ? COLORS.success : COLORS.amber }}
    />
    <span style={{ fontSize: 11, fontWeight: 800, color: online ? COLORS.mint : COLORS.amber, letterSpacing: '0.05em' }}>
      {online ? 'SYSTEM ONLINE' : 'OFFLINE MODE'}
    </span>
  </div>
)

const Clock = ({ color = COLORS.warmGray, mode = 'full' }) => {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  
  if (mode === 'time') {
    return <span style={{ fontSize: 12, color, position: 'relative', zIndex: 10 }}>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
  }

  const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: true }
  const formatted = time.toLocaleDateString('en-IN', options).replace(',', ' ·')
  return <span style={{ fontSize: 12, color, position: 'relative', zIndex: 10 }}>{formatted}</span>
}


const CountUp = ({ end, duration = 1.5 }) => {
  const [count, setCount] = useState(0)
  const isDecimal = end.toString().includes('.')
  useEffect(() => {
    let start = 0
    const target = parseFloat(end)
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [end, duration, isDecimal])
  return <>{count}</>
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const user = api.getUser()
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })
  const [isAvailable, setIsAvailable] = useState(true)
  const [schedule, setSchedule] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [queueData, setQueueData] = useState([])
  const [prescriptionHistory, setPrescriptionHistory] = useState([])
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [analytics, setAnalytics] = useState(null)
  const [scheduleNotif, setScheduleNotif] = useState(null)

  useEffect(() => {
    const loadNotifs = async () => {
      const saved = await dualLoad('gd_notifications', [])
      setNotifications(saved)
      const unreadCount = saved.filter(n => !n.read).length
      setNotificationCount(unreadCount)
    }
    loadNotifs()
  }, [])

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      
      const ctx = new AudioContextClass()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.setValueAtTime(800, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(ctx.currentTime)
      o.stop(ctx.currentTime + 0.4)
    } catch(e) {
      console.warn('Audio playback failed', e)
    }
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const normalizeQueueItem = (item) => {
    const patient = item?.patient || {}
    const symptoms = item?.symptoms || patient?.symptoms || []
    return {
      id: item?._id || item?.id || patient?._id || item?.createdAt,
      name: patient?.name || item?.name || 'Unknown',
      age: patient?.age ?? item?.age ?? null,
      village: patient?.village || item?.village || 'Unknown',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      urgency: item?.urgency || patient?.urgency || item?.triage?.urgency || 'UNSPECIFIED',
      triageSummary: item?.triageSummary || item?.triage?.summary || patient?.triageSummary || '',
      waitingSince: item?.createdAt
        ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : item?.waitingSince || '',
      time: item?.time || ''
    }
  }

  // Queue sync — load once from API/cache
  useEffect(() => {
    let isMounted = true
    const syncQueue = async () => {
      try {
        const liveQueue = await api.getQueue()
        if (!isMounted) return
        const normalized = (liveQueue || []).map(normalizeQueueItem)
        setQueueData(normalized)
        localStorage.setItem('gd_queue', JSON.stringify(normalized))
      } catch (e) {
        if (!isMounted) return
        const cached = await dualLoad('gd_queue', [])
        setQueueData(cached)
      }
    }
    syncQueue()
    const interval = setInterval(syncQueue, 60000)
    return () => { isMounted = false; clearInterval(interval) }
  }, [])



  useEffect(() => {
    async function loadData() {
      const sch = await dualLoad('gd_doctor_schedule', null)
      if (sch) {
        setSchedule(sch)
        if (typeof sch.isAvailable === 'boolean') {
          setIsAvailable(sch.isAvailable)
        }
      }
      
      const analyticsData = await dualLoad('gd_analytics', null)
      if (analyticsData) {
        setAnalytics(analyticsData)
      }

      const history = await dualLoad('gd_prescription_history', [])
      setPrescriptionHistory(history)
    }
    loadData()

    const handleStorageChange = (e) => {
      if (e.key === 'gd_doctor_schedule') {
        const sch = safeParse(e.newValue, null)
        if (sch && typeof sch.isAvailable === 'boolean') {
          setIsAvailable(sch.isAvailable)
          setSchedule(sch)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Schedule-based notifications
  useEffect(() => {
    if (!schedule?.morning && !schedule?.afternoon) return
    
    const checkSchedule = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()
      
      const parseHour = (timeStr) => {
        if (!timeStr) return null
        const hour = parseInt(timeStr.replace('AM','').replace('PM','').trim())
        if (timeStr.includes('PM') && hour !== 12) return hour + 12
        return hour
      }
      
      if (schedule.morning?.enabled) {
        const endHour = parseHour(schedule.morning.end)
        if (endHour && currentHour === endHour && currentMin === 0) {
          setScheduleNotif({
            type: 'break',
            message: 'Morning session complete! Time for your break. 🌤️',
            subtext: 'Afternoon session starts at ' + schedule.afternoon?.start
          })
          setTimeout(() => setScheduleNotif(null), 10000)
        }
      }
      
      if (schedule.afternoon?.enabled) {
        const startHour = parseHour(schedule.afternoon.start)
        if (startHour && currentHour === startHour && currentMin === 0) {
          setScheduleNotif({
            type: 'resume',
            message: 'Break time over! Afternoon session starting. 👨⚕️',
            subtext: 'Patients are waiting for you'
          })
          setTimeout(() => setScheduleNotif(null), 10000)
        }
        
        const endHour = parseHour(schedule.afternoon.end)
        if (endHour && currentHour === endHour && currentMin === 0) {
          setScheduleNotif({
            type: 'end',
            message: 'Your schedule for today is complete! 🎉',
            subtext: 'Great work today, Doctor.'
          })
          setTimeout(() => setScheduleNotif(null), 10000)
        }
      }
    }
    
    const interval = setInterval(checkSchedule, 60000)
    return () => clearInterval(interval)
  }, [schedule])
  
  const currentHour = new Date().getHours()
  const inMorning = currentHour >= 9 && currentHour < 13
  const inAfternoon = currentHour >= 15 && currentHour < 18

  const spring = { type: 'spring', stiffness: 100, damping: 20 }

  const parseTimeToMinutes = (value) => {
    if (!value) return null
    const match = String(value).trim().match(/^([0-9]{1,2})(?::([0-9]{2}))?\s*(AM|PM)$/i)
    if (!match) return null
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2] || '0', 10)
    const meridiem = match[3].toUpperCase()
    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const getSessionDuration = (start, end) => {
    const startMin = parseTimeToMinutes(start)
    const endMin = parseTimeToMinutes(end)
    if (startMin === null || endMin === null) return null
    const diff = endMin - startMin
    return diff > 0 ? diff : null
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', fontFamily: FONTS.body, color: COLORS.forest, overflow: 'hidden' }}>
      <AnimatedBackground />


      <div style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(232, 213, 188, 0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            background: 'rgba(15,61,42,0.05)', 
            borderRadius: 20, 
            padding: '6px 16px', 
            fontSize: 12, 
            color: COLORS.forest,
            display: 'flex', 
            gap: 16, 
            alignItems: 'center',
            border: '1px solid rgba(15,61,42,0.1)'
          }}>
            <span style={{ fontWeight: 600 }}>📅 {today}</span>
            <div style={{ width: 1, height: 12, background: 'rgba(15,61,42,0.2)' }} />
            <Clock mode="time" />
          </div>
        </div>
        <LiveIndicator online={isOnline} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <motion.div
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (notificationCount > 0) {
                  setNotificationCount(0)
                  const updated = notifications.map(n => ({ ...n, read: true }))
                  setNotifications(updated)
                  dualSave('gd_notifications', updated)
                }
              }}
              style={{ fontSize: 20, cursor: 'pointer' }}
            >
              🔔
            </motion.div>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: 35, right: -10, width: 280,
                    background: '#fff', borderRadius: 16, border: `1px solid ${COLORS.sandstone}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '16px', zIndex: 1000
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.forest, marginBottom: 12 }}>NOTIFICATIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(notifications || []).length > 0 ? (notifications || []).map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (n.patient) {
                            const incoming = {
                              id: n.patient.id,
                              name: n.patient.name,
                              age: n.patient.age,
                              village: n.patient.village,
                              symptoms: n.patient.symptoms || [],
                              urgency: n.patient.urgency,
                              triageSummary: n.patient.triageSummary,
                              waitingSince: n.patient.waitingSince
                            }
                            setQueueData(prev => {
                              const exists = prev.some(p => p.id && incoming.id && p.id === incoming.id)
                              if (exists) return prev
                              const updated = [incoming, ...prev]
                              localStorage.setItem('gd_queue', JSON.stringify(updated))
                              return updated
                            })
                            dualSave('gd_active_patient', incoming)
                            setNotificationCount(0)
                            setShowNotifications(false)
                            navigate('/app/consultation', { state: { patient: incoming } })
                          } else {
                            toast.error('No patient details available.')
                            setShowNotifications(false)
                            setNotificationCount(0)
                          }
                        }}
                        style={{ borderBottom: `1px solid ${COLORS.cream}`, paddingBottom: 8, cursor: n.patient ? 'pointer' : 'default' }}
                        onMouseEnter={e => n.patient && (e.currentTarget.style.background = COLORS.cream)}
                        onMouseLeave={e => n.patient && (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontSize: 12, color: COLORS.forest }}>{n.text}</div>
                        <div style={{ fontSize: 10, color: COLORS.warmGray, marginTop: 2 }}>{n.time}</div>
                      </div>
                    )) : <div style={{ fontSize: 12, color: COLORS.warmGray }}>No new notifications</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {notificationCount > 0 && (
              <div style={{ 
                position: 'absolute', top: -5, right: -5, 
                background: COLORS.critical, color: '#fff', 
                fontSize: 9, fontWeight: 800, width: 16, height: 16, 
                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', border: '2px solid #fff' 
              }}>
                {notificationCount}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 34, height: 34, borderRadius: '50%', background: COLORS.forest, color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 
            }}>
              {(user?.name || 'Dr').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Doctor'}</div>
          </div>
        </div>
      </div>

      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ position: 'relative', zIndex: 10, padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(15,61,42,0.06)', padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <div>
            <h1 style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 28, margin: 0 }}>Doctor Dashboard</h1>
            <p style={{ fontSize: 12, color: COLORS.warmGray, margin: '4px 0 0 0' }}>Welcome back, {user?.name?.split(' ')[0] || 'Doctor'}.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isAvailable ? COLORS.success : COLORS.warmGray }}>{isAvailable ? 'AVAILABLE' : 'BUSY'}</span>
                <div onClick={async () => {
                  const newStatus = !isAvailable
                  setIsAvailable(newStatus)
                  
                  // Optimistic UI + Dual Save
                  const updatedSchedule = { ...schedule, isAvailable: newStatus }
                  setSchedule(updatedSchedule)
                  dualSave('gd_doctor_schedule', updatedSchedule)
                  
                  try {
                    await api.toggleAvailability(newStatus)
                  } catch (e) {
                    console.error('Availability sync failed:', e)
                    toast.error('Sync failed, status saved locally')
                  }
                }} style={{ width: 44, height: 22, borderRadius: 11, background: isAvailable ? COLORS.success : COLORS.sandstone, position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                  <motion.div animate={{ x: isAvailable ? 24 : 2 }} style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }} />
                </div>
              </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24, position: 'relative', zIndex: 10 }}>
          {(() => {
            const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
            let avgTime = null
            if (Array.isArray(history) && history.length > 0) {
              const times = history.filter(rx => rx.startTime && rx.endTime).map(rx => {
                try {
                  const s = new Date(rx.startTime)
                  const e = new Date(rx.endTime)
                  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
                  const duration = (e - s) / 60000
                  return duration > 0 && duration < 600 ? duration : null
                } catch(_) { return null }
              })
              const filtered = times.filter(t => typeof t === 'number' && !isNaN(t))
              if (filtered.length > 0) avgTime = (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(1)
            }

            const now = new Date()
            const consultedToday = prescriptionHistory.filter(rx => {
              const d = new Date(rx.createdAt || rx.date)
              return d.getDate() === now.getDate() && 
                     d.getMonth() === now.getMonth() && 
                     d.getFullYear() === now.getFullYear()
            })
            const consultedCount = consultedToday.length

            const todayEarnings = consultedCount * 100
            const patientsToday = consultedCount
            const avgConsultTime = avgTime ? `${avgTime} min` : '—'

            return [
              { label: 'PATIENTS TODAY', value: patientsToday, sub: patientsToday > 0 ? `${patientsToday} consultations completed` : 'No consultations yet', theme: 'mint' },
              { label: 'AVG CONSULT TIME', value: avgConsultTime, sub: avgTime ? 'Based on recent consults' : 'No data yet', theme: 'amber' },
              { label: 'TODAY\'S EARNINGS', value: `₹${todayEarnings}`, sub: `${patientsToday} consultations × ₹100`, theme: 'forest' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1, ...spring }} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(15,61,42,0.06)', padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.warmGray, letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 48, fontWeight: 600, color: COLORS.forest }}>{typeof stat.value === 'number' ? <CountUp end={stat.value} /> : stat.value}</div>
                <div style={{ fontSize: 11, color: COLORS.warmGray }}>{stat.sub}</div>
              </motion.div>
            ))
          })()}
        </div>


        {/* SECTION 1 — TODAY'S SCHEDULE PREVIEW + QUICK ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: 16, marginBottom: 20, position: 'relative', zIndex: 10 }}>
          
          {/* LEFT CARD — Schedule */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(15,61,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 16, color: COLORS.forest, margin: 0 }}>📅 Today's Schedule</h2>
              <span onClick={() => navigate('/app/schedule')} style={{ fontSize: 11, color: COLORS.mint, cursor: 'pointer', fontWeight: 600 }}>Edit Schedule →</span>
            </div>
            
            {schedule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: inMorning ? COLORS.success : COLORS.sandstone }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>Morning · {schedule.morning?.start || 'Not set'} — {schedule.morning?.end || 'Not set'}</div>
                    <div style={{ fontSize: 11, color: COLORS.warmGray }}>
                      {(() => {
                        const minutes = getSessionDuration(schedule.morning?.start, schedule.morning?.end)
                        const slots = minutes && schedule.duration ? Math.round(minutes / schedule.duration) : null
                        return `${slots ? `~${slots}` : 'Slots N/A'} patients · ${schedule.duration || 'N/A'} min each`
                      })()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: inAfternoon ? COLORS.success : COLORS.sandstone }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>Afternoon · {schedule.afternoon?.start || 'Not set'} — {schedule.afternoon?.end || 'Not set'}</div>
                    <div style={{ fontSize: 11, color: COLORS.warmGray }}>
                      {(() => {
                        const minutes = getSessionDuration(schedule.afternoon?.start, schedule.afternoon?.end)
                        const slots = minutes && schedule.duration ? Math.round(minutes / schedule.duration) : null
                        return `${slots ? `~${slots}` : 'Slots N/A'} patients · ${schedule.duration || 'N/A'} min each`
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ border: `1px dashed ${COLORS.sandstone}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 8 }}>No schedule set for today</div>
                <span onClick={() => navigate('/app/schedule')} style={{ fontSize: 12, color: COLORS.forest, cursor: 'pointer', fontWeight: 600 }}>Set your availability →</span>
              </div>
            )}
            
            <div style={{ marginTop: 20 }}>
              {(() => {
                const totalSlots = schedule?.maxPatients
                const filled = queueData.length
                const percent = totalSlots ? Math.min(100, (filled / totalSlots) * 100) : 0
                return (
                  <>
                    <div style={{ fontSize: 11, color: COLORS.warmGray, marginBottom: 6 }}>{filled} of {totalSlots ?? 'N/A'} slots filled</div>
                    <div style={{ height: 6, borderRadius: 4, background: COLORS.sandstone, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }} style={{ height: '100%', background: COLORS.mint }} />
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.div>

          {/* RIGHT CARD — Quick Actions */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(15,61,42,0.06)' }}>
            <h2 style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 14, color: COLORS.forest, margin: '0 0 16px 0' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '👥', label: 'Start Consultation', path: '/app/consultation' },
                { icon: '📊', label: 'View Analytics', path: '/app/village-reports' },
                { icon: '📅', label: 'My Schedule', path: '/app/schedule' }
              ].map((act, i) => (
                <motion.div key={act.label} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.08, ...spring }}
                  onClick={() => navigate(act.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, cursor: 'pointer', transition: '0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f7f3ed'; e.currentTarget.style.borderLeft = `2px solid ${COLORS.mint}` }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = 'none' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{act.icon}</div>
                  <div style={{ fontSize: 13, color: COLORS.forest, fontWeight: 600, flex: 1 }}>{act.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.warmGray }}>→</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* SECTION 3 — IMPACT */}
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 10 }}>
          {/* Impact Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} style={{ background: 'linear-gradient(135deg, #0f3d2a, #1d5c3a)', borderRadius: 16, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(123,202,164,0.1)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 18, margin: '0 0 24px 0' }}>🌿 Your Impact</h2>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 52, fontWeight: 700, lineHeight: 1 }}>
                  {analytics?.patientsHelped ?? Object.values(safeParse(localStorage.getItem('gd_consultation_status'), {})).filter(v => typeof v === 'string' && v.toLowerCase().includes('sent')).length}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>patients helped</div>
              </div>
              
              <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 0 20px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 24, color: COLORS.mint }}>
                    {analytics?.travelCostSaved !== undefined ? `₹${Number(analytics.travelCostSaved).toLocaleString('en-IN')}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>travel costs saved</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 24, color: COLORS.mint }}>
                    {analytics?.distanceSaved !== undefined ? `${Number(analytics.distanceSaved).toLocaleString('en-IN')} km` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>distance avoided</div>
                </div>
              </div>
              
              <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 11, opacity: 0.6, textAlign: 'center', lineHeight: 1.5 }}>
                Every consultation brings quality healthcare<br/>closer to rural Bharat 🙏
              </div>
            </div>
          </motion.div>
        </div>

        <div style={{ marginTop: 40, padding: '20px 0', borderTop: `1px solid ${COLORS.sandstone}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <span style={{ fontSize: 10, color: COLORS.warmGray }}>© {new Date().getFullYear()} GramDoc Rural Health Systems</span>
        </div>
      </motion.main>

      <AnimatePresence>
        {scheduleNotif && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'fixed', top: 80, right: 20, zIndex: 10000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '16px 20px', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(232,213,188,0.5)' }}
          >
            <button onClick={() => setScheduleNotif(null)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: COLORS.warmGray, cursor: 'pointer', fontSize: 16 }}>×</button>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{scheduleNotif.type === 'break' ? '☕' : scheduleNotif.type === 'resume' ? '🏥' : '🌙'}</div>
            <div style={{ fontFamily: FONTS.display, fontStyle: 'italic', fontSize: 15, color: COLORS.forest, marginBottom: 4 }}>{scheduleNotif.message}</div>
            <div style={{ fontSize: 11, color: COLORS.warmGray }}>{scheduleNotif.subtext}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
