import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, dualSave, dualLoad } from '../utils/api'
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
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Schedule() {
  const init = (() => {
    try {
      const saved = localStorage.getItem('gd_doctor_schedule')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {}
  })()

  const [isAvailableToday, setIsAvailableToday] = useState(init.isAvailableToday || false)
  const [morning, setMorning] = useState(init.morning || { enabled: false, start: '', end: '' })
  const [afternoon, setAfternoon] = useState(init.afternoon || { enabled: false, start: '', end: '' })
  const [evening, setEvening] = useState(init.evening || { enabled: false, start: '', end: '' })
  const [maxPatients, setMaxPatients] = useState(init.maxPatients || '')
  const [duration, setDuration] = useState(init.duration || '')
  const [hasSchedule, setHasSchedule] = useState(Boolean(init.morning?.start || init.afternoon?.start || init.evening?.start || init.busySlots?.length > 0))
  const [busySlots, setBusySlots] = useState(init.busySlots || [])
  const [newBusy, setNewBusy] = useState('')

  useEffect(() => {
    const hasAnySchedule =
      !!(morning?.enabled && morning?.start && morning?.end) ||
      !!(afternoon?.enabled && afternoon?.start && afternoon?.end) ||
      !!(evening?.enabled && evening?.start && evening?.end) ||
      busySlots.length > 0
    setHasSchedule(hasAnySchedule)
  }, [morning, afternoon, evening, busySlots])

  useEffect(() => {

    const handleStorageChange = (e) => {
      if (e.key === 'gd_doctor_schedule') {
        try {
          const saved = JSON.parse(e.newValue)
          if (saved) {
            setIsAvailableToday(saved.isAvailableToday)
            if (saved.morning) setMorning(saved.morning)
            if (saved.afternoon) setAfternoon(saved.afternoon)
            if (saved.evening) setEvening(saved.evening)
            if (saved.maxPatients) setMaxPatients(saved.maxPatients)
            if (saved.duration) setDuration(saved.duration)
            if (saved.busySlots) setBusySlots(saved.busySlots)
          }
        } catch(err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleSave = async () => {
    const schedule = {
      isAvailableToday,
      morning,
      afternoon,
      evening,
      maxPatients,
      duration,
      busySlots
    }
    try {
      await api.saveSchedule(schedule)
      dualSave('gd_doctor_schedule', schedule)
      toast.success('Schedule saved!')
    } catch (e) {
      toast.error('Could not save schedule')
    }
  }

  const addBusySlot = () => {
    if (!newBusy) return
    setBusySlots([...busySlots, newBusy])
    setNewBusy('')
  }

  const removeBusySlot = (idx) => {
    setBusySlots(busySlots.filter((_, i) => i !== idx))
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const currentDayName = new Date().toLocaleDateString('en-IN', { weekday: 'short' })

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, paddingBottom: 40 }}>
      
      {/* LEFT: SET AVAILABILITY FORM */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 24, border: '1px solid #e8d5bc', padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
      >
        <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 24, color: COLORS.forest, margin: 0 }}>My Schedule</h1>
        <p style={{ fontSize: 13, color: COLORS.warmGray, marginTop: 4 }}>Set your available hours for patients</p>

        <div style={{ background: COLORS.mintLight, padding: '12px 16px', borderRadius: 12, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest }}>{today}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.mint, letterSpacing: '0.05em' }}>TODAY</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingBottom: 24, borderBottom: `1px solid ${COLORS.sandstone}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest }}>Available Today</div>
            <div style={{ fontSize: 11, color: COLORS.warmGray }}>Accepting consultations</div>
          </div>
          <div onClick={() => setIsAvailableToday(!isAvailableToday)} style={{ width: 44, height: 22, borderRadius: 11, background: isAvailableToday ? COLORS.success : COLORS.sandstone, position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
            <motion.div 
              animate={{ x: isAvailableToday ? 24 : 2 }} 
              transition={{ duration: 0.15 }}
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }} 
            />
          </div>
        </div>

        <div style={{ opacity: isAvailableToday ? 1 : 0.4, pointerEvents: isAvailableToday ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <SessionBuilder label="Morning Session" session={morning} setSession={setMorning} />
          <SessionBuilder label="Afternoon Session" session={afternoon} setSession={setAfternoon} />
          <SessionBuilder label="Evening Session" session={evening} setSession={setEvening} />

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: COLORS.warmGray, display: 'block', marginBottom: 8 }}>MAX PATIENTS</label>
              <input type="number" value={maxPatients} onChange={e => setMaxPatients(e.target.value)} placeholder="e.g. 15" style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${COLORS.sandstone}`, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: COLORS.warmGray, display: 'block', marginBottom: 8 }}>DURATION (MINS)</label>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${COLORS.sandstone}`, outline: 'none', background: '#fff' }}>
                <option value="">Set duration</option>
                {[10, 15, 20, 30].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: COLORS.warmGray, display: 'block', marginBottom: 8 }}>BUSY HOURS</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="text" value={newBusy} onChange={e => setNewBusy(e.target.value)} placeholder="e.g. 1PM-2PM Lunch" style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${COLORS.sandstone}`, outline: 'none', fontSize: 13 }} />
              <button onClick={addBusySlot} style={{ background: COLORS.forest, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 800 }}>+</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {busySlots.length > 0 ? busySlots.map((s, i) => (
                <div key={i} style={{ background: '#fff4e6', color: COLORS.terracotta, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #ffd8a8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s} <span onClick={() => removeBusySlot(i)} style={{ cursor: 'pointer', fontSize: 14 }}>×</span>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', border: `1.5px dashed ${COLORS.sandstone}`, borderRadius: 12, width: '100%' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>📅</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.forest }}>No busy slots added</div>
                  <div style={{ fontSize: 10, color: COLORS.warmGray }}>Add breaks or personal time above</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          style={{ width: '100%', marginTop: 32, background: COLORS.forest, color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Save Schedule
        </motion.button>
      </motion.div>

      {/* RIGHT: WEEKLY SCHEDULE VIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ background: '#fff', borderRadius: 24, border: '1px solid #e8d5bc', padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 20, color: COLORS.forest, margin: 0 }}>Weekly Calendar</h2>
            <div style={{ display: 'flex', gap: 12 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.mint }} />
                 <span style={{ fontSize: 11, color: COLORS.warmGray }}>Available</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.terracotta }} />
                 <span style={{ fontSize: 11, color: COLORS.warmGray }}>Busy</span>
               </div>
            </div>
          </div>

          {!hasSchedule ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', border: `1.5px dashed ${COLORS.sandstone}`, borderRadius: 16, color: COLORS.warmGray }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>📅</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.forest }}>No schedule data yet</div>
              <div style={{ fontSize: 11, color: COLORS.warmGray, marginTop: 4 }}>Set your sessions on the left to see the weekly view</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
              {DAYS.map((day, i) => (
                <motion.div 
                  key={day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: day === currentDayName ? COLORS.mint : COLORS.warmGray, marginBottom: 12 }}>{day.toUpperCase()}</div>
                  <div style={{ 
                    height: 300, background: day === currentDayName ? COLORS.mintLight : '#fcfcfc', borderRadius: 16, border: day === currentDayName ? `1.5px solid ${COLORS.mint}` : `1px solid ${COLORS.sandstone}`,
                    display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: 8, position: 'relative'
                  }}>
                    {day === currentDayName && isAvailableToday ? (
                      <>
                        {morning.enabled && morning.start && morning.end && <div style={{ background: COLORS.mint, color: '#fff', padding: '6px 4px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>{morning.start}-{morning.end}</div>}
                        {afternoon.enabled && afternoon.start && afternoon.end && <div style={{ background: COLORS.mint, color: '#fff', padding: '6px 4px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>{afternoon.start}-{afternoon.end}</div>}
                        {evening.enabled && evening.start && evening.end && <div style={{ background: COLORS.mint, color: '#fff', padding: '6px 4px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>{evening.start}-{evening.end}</div>}
                        {busySlots.map((s, idx) => (
                          <div key={idx} style={{ background: COLORS.terracotta, color: '#fff', padding: '4px 4px', borderRadius: 6, fontSize: 8, fontWeight: 800 }}>{s.split(' ')[0]} BUSY</div>
                        ))}
                      </>
                    ) : (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', fontSize: 10, fontWeight: 800, color: COLORS.sandstone, letterSpacing: '0.2em' }}>OFF</div>
                    )}
                    {day === currentDayName && !isAvailableToday && <div style={{ background: '#fff', position: 'absolute', inset: 0, opacity: 0.5, borderRadius: 16 }} />}
                  </div>
                  <button 
                    onClick={() => {
                      if (day === currentDayName && isAvailableToday) {
                        const slots = [
                          morning.enabled && morning.start && morning.end ? `Morning: ${morning.start}-${morning.end}` : '',
                          afternoon.enabled && afternoon.start && afternoon.end ? `Afternoon: ${afternoon.start}-${afternoon.end}` : '',
                          evening.enabled && evening.start && evening.end ? `Evening: ${evening.start}-${evening.end}` : '',
                          ...busySlots.map(s => `BUSY: ${s}`)
                        ].filter(Boolean).join('\n')
                        
                        const text = `My Schedule for ${day}:\n${slots}`
                        
                        if (navigator.clipboard && window.isSecureContext) {
                          navigator.clipboard.writeText(text).then(() => {
                            toast.success('Schedule copied to clipboard!')
                          })
                        } else {
                          const textArea = document.createElement('textarea')
                          textArea.value = text
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-9999px'
                          textArea.style.top = '0'
                          document.body.appendChild(textArea)
                          textArea.focus()
                          textArea.select()
                          try {
                            document.execCommand('copy')
                            toast.success('Schedule copied!')
                          } catch (err) {
                            toast.error('Copy not supported')
                          }
                          document.body.removeChild(textArea)
                        }
                      } else {
                        toast.error('No active schedule to copy for this day')
                      }
                    }}
                    style={{ marginTop: 12, border: 'none', background: 'transparent', color: COLORS.mint, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                  >
                    COPY
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div />
      </div>
    </div>
  )
}

function SessionBuilder({ label, session, setSession }) {
  const starts = label.includes('Morning') ? ['7AM','8AM','9AM','10AM','11AM'] : label.includes('Afternoon') ? ['1PM','2PM','3PM','4PM'] : ['5PM','6PM','7PM']
  const ends = label.includes('Morning') ? ['11AM','12PM','1PM','2PM'] : label.includes('Afternoon') ? ['4PM','5PM','6PM','7PM'] : ['8PM','9PM','10PM']

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.forest }}>{label}</span>
        <div onClick={() => setSession({...session, enabled: !session.enabled})} style={{ width: 44, height: 22, borderRadius: 11, background: session.enabled ? COLORS.mint : COLORS.sandstone, position: 'relative', cursor: 'pointer' }}>
          <motion.div animate={{ x: session.enabled ? 24 : 2 }} style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: session.enabled ? 1 : 0.4, pointerEvents: session.enabled ? 'auto' : 'none' }}>
        <select value={session.start} onChange={e => setSession({...session, start: e.target.value})} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${COLORS.sandstone}`, fontSize: 12, background: '#fff' }}>
          <option value="">Start</option>
          {starts.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={session.end} onChange={e => setSession({...session, end: e.target.value})} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${COLORS.sandstone}`, fontSize: 12, background: '#fff' }}>
          <option value="">End</option>
          {ends.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
    </div>
  )
}
