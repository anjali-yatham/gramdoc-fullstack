import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, dualSave, dualLoad, safeParse } from '../utils/api'
import { COLORS, urgencyColor, urgencyBg, genPatientId, getInitials, daysAgoLabel, PATIENTS } from './consultationData'
import toast from 'react-hot-toast'

const C = COLORS;
const spring = { type: 'spring', stiffness: 300, damping: 24 };

export default function Consultation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePatient, setActivePatient] = useState(() => {
    const saved = safeParse(localStorage.getItem('gd_active_patient'), null)
    const callStart = localStorage.getItem('gd_call_start')
    
    if (saved && saved.name && callStart) {
      const startTime = parseInt(callStart)
      if (isNaN(startTime) || Date.now() - startTime > 2 * 60 * 60 * 1000) {
        return null
      }
      
      const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
      if (history.some(rx => rx.patientName === saved.name)) return null
      if (localStorage.getItem('gd_banner_dismissed') === saved.name) return null
      
      return saved
    }
    return null
  })
  const [prescriptionHistory, setPrescriptionHistory] = useState(() => safeParse(localStorage.getItem('gd_prescription_history'), []))
  const [queue, setQueue] = useState(() => safeParse(localStorage.getItem('gd_queue'), []))
  const currentUser = api.getUser()
  const isDoctor = currentUser?.role === 'doctor'

  const [search, setSearch] = useState('')
  const urlTab = new URLSearchParams(window.location.search).get('tab')
  const [activeTab, setActiveTab] = useState(urlTab === 'history' ? 'History' : "Today's Queue")
  const [justConsulted, setJustConsulted] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(() => {
    const saved = safeParse(localStorage.getItem('gd_active_patient'), {})
    return saved?.name ? { ...saved, symptom: saved.symptoms?.[0] || 'Consultation', aiSummary: saved.triageSummary, status: 'Pending' } : null
  })
  const [patients, setPatients] = useState(() => safeParse(localStorage.getItem('gd_queue'), []))
  const [isStarting, setIsStarting] = useState(false)
  const [isSearchingBackend, setIsSearchingBackend] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const q = await api.getQueue()
        if (q && q.length > 0) {
           dualSave('gd_queue', q)
           setQueue(q)
           setPatients(q)
        }
      } catch(e) {
        // silent fallback to local queue
      }

      if (location.state?.patient) {
        setSelectedPatient({
          ...location.state.patient,
          symptom: location.state.patient.symptoms?.[0] || 'Consultation',
          aiSummary: location.state.patient.triageSummary,
          status: 'Pending'
        })
      }
    }
    loadData()
  }, [location.state])
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterDone, setTypewriterDone] = useState({})
  const [callSeconds, setCallSeconds] = useState(0)
  const twRef = useRef(null)

  useEffect(() => {
    const myHistory = prescriptionHistory.filter(rx => rx.doctorName === currentUser?.name || rx.doctor?.name === currentUser?.name)
    const latestRx = myHistory[0]
    const lastSeenId = sessionStorage.getItem('gd_last_rx_id')
    
    if (latestRx) {
      if (lastSeenId && latestRx._id !== lastSeenId) {
        setActiveTab('History')
        setJustConsulted(latestRx.patientName)
        setTimeout(() => setJustConsulted(null), 1500)
      }
      sessionStorage.setItem('gd_last_rx_id', latestRx._id)
    } else {
      sessionStorage.setItem('gd_last_rx_id', 'none')
    }
  }, [currentUser?.name])



  useEffect(() => {
    const startTime = localStorage.getItem('gd_call_start')
    if (!startTime || !activePatient) return
    
    const elapsedSecs = Math.floor((Date.now() - parseInt(startTime)) / 1000)
    setCallSeconds(elapsedSecs > 0 ? elapsedSecs : 0)
    
    const interval = setInterval(() => {
      setCallSeconds(s => s + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [activePatient])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // Typewriter effect
  useEffect(() => {
    const summary = selectedPatient?.aiSummary || selectedPatient?.triageSummary
    if (!selectedPatient?.name || !summary || typewriterDone[selectedPatient.name]) {
      if (summary) setTypewriterText(summary)
      return
    }
    setTypewriterText('')
    let i = 0
    const txt = summary
    clearInterval(twRef.current)
    twRef.current = setInterval(() => {
      i++
      setTypewriterText(txt.slice(0, i))
      if (i >= txt.length) {
        clearInterval(twRef.current)
        setTypewriterDone(p => ({ ...p, [selectedPatient.name]: true }))
      }
    }, 12)
    return () => clearInterval(twRef.current)
  }, [selectedPatient?.name])

  // Intelligent Search Logic
  useEffect(() => {
    if (search.length <= 3) return

    const q = search.toLowerCase()
    
    // Check local results first
    const localMatches = prescriptionHistory.filter(rx => 
      rx.patientName.toLowerCase().includes(q)
    )

    if (localMatches.length === 0 && !isSearchingBackend) {
      setIsSearchingBackend(true)
      api.searchPatients(search).then(results => {
        if (results && results.length > 0) {
          setPrescriptionHistory(prev => {
            // Merge and remove duplicates by ID or name+date
            const combined = [...prev, ...results]
            const unique = combined.filter((v, i, a) => 
              a.findIndex(t => (t._id === v._id || (t.patientName === v.patientName && t.createdAt === v.createdAt))) === i
            )
            return unique
          })
        }
      }).finally(() => setIsSearchingBackend(false))
    }
  }, [search, prescriptionHistory.length])

  const handleStartConsultation = (patient) => {
    if (!patient?.name) {
      toast.error('Cannot start consultation: Patient data missing');
      return;
    }
    setIsStarting(true)
    localStorage.removeItem('gd_banner_dismissed')
    
    const activeData = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      village: patient.village,
      symptom: patient.symptom,
      urgency: patient.urgency,
      bloodGroup: patient.bloodGroup,
      ashaReferred: patient.ashaReferred
    }
    
    dualSave('gd_active_patient', activeData)
    
    const triageData = {
      symptoms: patient.symptom,
      urgency: patient.urgency?.toLowerCase() || 'unspecified'
    }
    dualSave('gd_triage', triageData)
    
    const consId = 'cons_' + Date.now()
    dualSave('gd_consultation_id', consId)
    localStorage.setItem('gd_call_start', Date.now().toString())
    
    navigate('/app/consultation/call')
  }

  const handleViewRx = (p) => {
    if (!p?.name) return;
    const rx = prescriptionHistory.find(r => r.patientName === p.name)
    if (rx) {
      dualSave('gd_prescription_final', rx)
    } else if (p.medicines?.length) {
      dualSave('gd_prescription_final', { medicines: p.medicines, patientName: p.name })
    }
    navigate('/app/prescriptions')
  }

  // ── SEVERITY BARS ──
  const SeverityBars = ({ urgency }) => {
    const lvl = urgency === 'CRITICAL' ? 5 : urgency === 'HIGH' ? 4 : urgency === 'MEDIUM' ? 3 : 1
    return (
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 18 }}>
        {[1,2,3,4,5].map(i => (
          <motion.div key={i}
            animate={urgency === 'CRITICAL' && i <= lvl ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
            style={{ width: 4, height: 4 + i * 3, borderRadius: 2, background: i <= lvl ? urgencyColor(urgency) : '#e0d6ca' }}
          />
        ))}
      </div>
    )
  }

  // ── ACTIVE BANNER ──
  const ActiveBanner = () => (
    <motion.div initial={{ y: -60 }} animate={{ y: 0 }} transition={spring}
      style={{ background: 'linear-gradient(90deg, #0f3d2a, #1d9e75)', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Active Consultation</span>
      </div>
      <span style={{ color: '#fff', fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18, flex: 1, textAlign: 'center' }}>{activePatient?.name || 'Active Patient'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{formatTime(callSeconds)}</span>
        <button onClick={() => navigate('/app/consultation/call')}
          style={{ background: C.mint, color: C.forest, border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Resume Call →
        </button>
        <button 
          onClick={() => {
            localStorage.setItem('gd_banner_dismissed', activePatient?.name || 'none')
            setActivePatient(null)
          }}
          style={{ 
            width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', 
            border: 'none', cursor: 'pointer', color: 'white', fontSize: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          ×
        </button>
      </div>
    </motion.div>
  )

  // ── LEFT COLUMN ──
  const LeftCol = () => {
    const queuePatients = useMemo(() => patients.filter(p => {
      // Filter out patients who already have a prescription sent in this session or history
      const isConsulted = prescriptionHistory.some(rx => rx.patientName === p.name)
      if (isConsulted) return false
      
      const q = search.toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || (p.symptom || '').toLowerCase().includes(q)
    }).sort((a, b) => {
      if (!a || !b) return 0
      const u = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 }
      return (u[a?.urgency] || 5) - (u[b?.urgency] || 5)
    }), [patients, prescriptionHistory, search])

    const myHistory = useMemo(() => prescriptionHistory.filter(rx => rx.doctorName === currentUser?.name || rx.doctor?.name === currentUser?.name), [prescriptionHistory, currentUser?.name])
    const historyFiltered = useMemo(() => myHistory.filter(rx => {
      const q = search.toLowerCase()
      return !q || rx.patientName.toLowerCase().includes(q)
    }), [myHistory, search])
    
    const historyGroups = useMemo(() => {
      const groups = {}
      historyFiltered.forEach(rx => {
        const d = rx.date || new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        if (!groups[d]) groups[d] = []
        groups[d].push(rx)
      })
      return groups
    }, [historyFiltered])

    const sortedDates = useMemo(() => Object.keys(historyGroups).sort((a, b) => new Date(b) - new Date(a)), [historyGroups])

    const allConsulted = patients.length > 0 && patients.every(p => prescriptionHistory.some(rx => rx.patientName === p.name))

    return (
      <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(232,213,188,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <div style={{ padding: '20px 20px 0' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: C.forest, margin: '0 0 14px' }}>Consultations</h2>
          
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name..."
              style={{ width: '100%', padding: '10px 16px 10px 36px', borderRadius: 50, border: `1px solid ${C.sandstone}`, background: C.cream, fontSize: 13, outline: 'none', fontFamily: "'Mukta', sans-serif" }} />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 14 }}>
              {isSearchingBackend ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⌛</motion.div>
              ) : '🔍'}
            </span>
          </div>

          <div style={{ display: 'flex', background: C.cream, borderRadius: 10, padding: 3, marginBottom: 16 }}>
            {["Today's Queue", "History"].map(tab => (
              <div 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  borderRadius: 8, transition: 'color 0.2s ease', position: 'relative',
                  color: activeTab === tab ? '#fff' : C.warmGray,
                  zIndex: 1
                }}
              >
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', inset: 0, background: C.forest, borderRadius: 8, zIndex: -1 }} 
                  />
                )}
                {tab}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
          {activeTab === "Today's Queue" && (
            <>
              {queuePatients.map((p, idx) => {
                const sel = selectedPatient?.name === p.name
                const waitTime = p.daysAgo === 0 ? 'Waiting since morning' : 'Waiting'
                
                return (
                  <div key={p.id || p._id || `queue-${p.name}-${idx}`} onClick={() => setSelectedPatient({ ...p, status: 'Pending' })}
                    style={{ padding: 12, borderRadius: 10, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      background: sel ? '#0f3d2a' : '#ffffff', borderLeft: `3px solid ${sel ? '#7bcaa4' : urgencyColor(p.urgency)}`, transition: 'all 0.15s ease' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: sel ? 'rgba(255,255,255,0.2)' : urgencyBg(p.urgency), color: sel ? '#fff' : urgencyColor(p.urgency),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {getInitials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#ffffff' : '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.7)' : C.warmGray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.symptom}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sel ? 'rgba(255,255,255,0.2)' : urgencyBg(p.urgency), color: sel ? '#ffffff' : urgencyColor(p.urgency) }}>{p.urgency}</div>
                      <div style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.6)' : C.warmGray, marginTop: 4 }}>{waitTime}</div>
                    </div>
                  </div>
                )
              })}
              {queuePatients.length === 0 && !search && (
                <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 12, border: `1px dashed ${C.sandstone}`, margin: '20px 0' }}>
                  <span style={{ fontSize: 40, marginBottom: 12 }}>🟢</span>
                  <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18, color: C.forest, marginBottom: 8 }}>Queue is clear!</div>
                  <div style={{ fontSize: 13, color: C.warmGray }}>No patients waiting right now. Enjoy the break!</div>
                  <div style={{ fontSize: 11, color: C.warmGray, marginTop: 12, opacity: 0.6 }}>New patient arrivals will appear here.</div>
                </div>
              )}
              {queuePatients.length === 0 && search && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: `1px dashed ${C.sandstone}`, margin: '10px 0' }}>
                   <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                   <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: C.forest, marginBottom: 4 }}>No patients found</div>
                   <div style={{ fontSize: 11, color: C.warmGray }}>Try searching with a different name</div>
                </div>
              )}
            </>
          )}

          {activeTab === "History" && (
            <>
              {sortedDates.map(dateStr => (
                <div key={dateStr}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 1, background: C.sandstone }} />
                    <div style={{ fontSize: 10, color: C.warmGray, fontWeight: 700, textTransform: 'uppercase' }}>{dateStr}</div>
                  </div>
                  {historyGroups[dateStr].map((rx, idx) => {
                    const sel = selectedPatient?.name === rx.patientName
                    const isJustConsulted = justConsulted === rx.patientName
                    const pInfo = patients.find(p => p.name === rx.patientName) || { age: null, gender: null, village: null, district: null, bloodGroup: null, urgency: null }
                    return (
                      <div key={rx._id || rx.id || `hist-${idx}`} onClick={() => setSelectedPatient({ ...pInfo, ...rx, name: rx.patientName, symptom: rx.diagnosis, status: 'Prescription sent', medicines: rx.medicines })}
                        style={{ padding: 12, borderRadius: 10, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                          background: sel ? '#0f3d2a' : isJustConsulted ? '#e8f5ee' : '#ffffff', 
                          borderLeft: `3px solid ${sel ? '#7bcaa4' : C.mint}`, 
                          transition: 'all 0.4s ease' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: sel ? 'rgba(255,255,255,0.2)' : '#e8f5ee', color: sel ? '#fff' : C.mint,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {getInitials(rx.patientName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#ffffff' : '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rx.patientName}</div>
                          <div style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.7)' : C.warmGray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rx.diagnosis}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sel ? 'rgba(255,255,255,0.2)' : '#dcfce7', color: sel ? '#ffffff' : '#166534' }}>Consulted ✓</div>
                          <div style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.6)' : C.warmGray, marginTop: 4 }}>{rx.time || ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {sortedDates.length === 0 && !search && (
                <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 12, border: `1px dashed ${C.sandstone}`, margin: '20px 0' }}>
                  <span style={{ fontSize: 40, marginBottom: 12 }}>📋</span>
                  <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18, color: C.forest, marginBottom: 8 }}>No history found</div>
                  <div style={{ fontSize: 13, color: C.warmGray }}>Patients you consult will appear here with their prescription summaries.</div>
                </div>
              )}
              {sortedDates.length === 0 && search && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: `1px dashed ${C.sandstone}`, margin: '10px 0' }}>
                   <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                   <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: C.forest, marginBottom: 4 }}>No patients found</div>
                   <div style={{ fontSize: 11, color: C.warmGray }}>Try searching with a different name</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── MIDDLE COLUMN ──
  const MiddleCol = () => {
    return (
      <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 16, border: '1px solid rgba(232,213,188,0.5)', height: '100%', overflowY: 'auto', opacity: 1 }}>
        {!selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40, textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>👈</span>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: C.forest, fontSize: 18 }}>Select a patient from the list to view details</div>
            <p style={{ fontSize: 13, color: C.warmGray }}>Queue and history are available in the left panel</p>
          </div>
        ) : (() => {
          const p = selectedPatient
          const urgency = p.urgency || 'UNSPECIFIED'
          const inQueue = queue.some(q => q.name === p.name)
          return (
            <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.forest, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {getInitials(p.name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 22, color: C.forest, margin: 0 }}>{p.name}</h2>
            <div style={{ fontSize: 11, color: C.warmGray, marginTop: 2 }}>Patient ID: {genPatientId(p.name)}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: C.sandstone, color: C.warmGray }}>{p.age ?? 'N/A'} yrs</span>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: C.sandstone, color: C.warmGray }}>{p.gender || 'N/A'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, background: urgencyBg(urgency), color: urgencyColor(urgency) }}>{urgency}</div>
            <div style={{ fontSize: 11, color: C.warmGray, marginTop: 6 }}>Last visit: {p.lastVisit || 'Not recorded'}</div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
          {/* Village */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>📍 Village</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>{[p.village, p.district].filter(Boolean).join(', ') || 'Not recorded'}</div>
          </div>
          {/* Blood Group */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Blood Group</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.forest, fontFamily: "'Fraunces', serif" }}>{p.bloodGroup || 'N/A'}</div>
          </div>
          {/* ASHA */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>ASHA Worker</div>
            {p.ashaReferred
              ? <div style={{ fontSize: 12, color: C.mint, fontWeight: 600 }}>✅ Referred by ASHA</div>
              : <div style={{ fontSize: 12, color: C.warmGray, fontStyle: 'italic' }}>Direct registration</div>}
          </div>
          {/* AI Urgency */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>AI Urgency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: urgencyBg(urgency), color: urgencyColor(urgency) }}>{urgency}</span>
              <SeverityBars urgency={urgency} />
            </div>
          </div>
          {/* Last Visit */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Last Visit</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>{p.lastVisit || 'Not recorded'}</div>
            <div style={{ fontSize: 11, color: C.warmGray }}>{p.daysAgo !== undefined ? daysAgoLabel(p.daysAgo) : 'N/A'}</div>
          </div>
          {/* Status */}
          <div style={{ background: C.cream, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Status</div>
            {p.status?.toLowerCase().includes('sent') && <div style={{ fontSize: 12, color: C.mint, fontWeight: 600 }}>Prescription sent ✓</div>}
            {p.status?.toLowerCase().includes('pending') && <div style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>⏳ Pending</div>}
            {p.status?.toLowerCase().includes('active') && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● In Progress</motion.div>}
          </div>
        </div>

        {/* Primary Symptoms */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.terracotta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Primary Symptoms</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(() => {
              const symptoms = (p.symptoms || [p.symptom]).filter(Boolean)
              if (symptoms.length === 0) {
                return <span style={{ fontSize: 12, color: C.warmGray, fontStyle: 'italic' }}>No symptoms recorded</span>
              }
              return symptoms.map((s, i) => (
                <span key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: C.cream, color: C.warmGray, border: `1px solid ${C.sandstone}` }}>{s}</span>
              ))
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.status?.toLowerCase().includes('pending') && (
            <button 
              disabled={isStarting}
              onClick={() => handleStartConsultation(p)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: C.forest, color: '#fff', fontWeight: 700, fontSize: 14, cursor: isStarting ? 'not-allowed' : 'pointer', opacity: isStarting ? 0.7 : 1 }}>
              {isStarting ? 'Preparing secure call...' : 'Start Consultation →'}
            </button>
          )}
          {p.status?.toLowerCase().includes('sent') && (
            <button onClick={() => handleViewRx(p)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${C.forest}`, background: 'transparent', color: C.forest, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              View Prescription →
            </button>
          )}
          {!inQueue && (
            <button onClick={async () => {
              const q = [...queue, { name: p.name, symptom: p.symptom, urgency: p.urgency }]
              try {
                await api.saveQueue(q)
                dualSave('gd_queue', q)
                setQueue(q)
                setSelectedPatient({ ...p })
                toast.success('Patient added to queue')
              } catch(e) {
                toast.error('Patient added locally — will sync when online.')
                dualSave('gd_queue', q)
                setQueue(q)
                setSelectedPatient({ ...p })
              }
            }}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: C.mint, color: C.forest, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Add to Queue
            </button>
          )}
        </div>
      </div>
          )
        })()}
      </div>
    )
  }

  // ── RIGHT COLUMN ──
  const RightCol = () => {
    const p = selectedPatient
    const showSummary = p && p.status?.toLowerCase().includes('sent')
    const showRx = p && p.status?.toLowerCase().includes('sent') && p.medicines?.length > 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
        {/* AI Notes */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(232,213,188,0.5)', padding: 18, overflow: 'auto' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, color: C.forest, margin: '0 0 4px' }}>🤖 AI Session Notes</h3>
          <p style={{ fontSize: 10, color: C.warmGray, margin: '0 0 14px' }}>Auto-generated after consultation</p>
          {(() => {
            const summary = p?.aiSummary || p?.triageSummary || p?.triage?.summary
            if (summary) {
              return (
                <div>
                  <div style={{ fontSize: 13, color: '#2d2d2d', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {showSummary ? typewriterText : summary}
                    {showSummary && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ borderRight: typewriterDone[p.name] ? 'none' : '2px solid ' + C.forest }} />}
                  </div>
                </div>
              )
            }
            return (
              <div style={{ border: `2px dashed ${C.sandstone}`, borderRadius: 12, padding: 30, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
                <div style={{ fontSize: 12, color: C.warmGray, fontStyle: 'italic' }}>Voice notes will appear here after consultation</div>
                <div style={{ fontSize: 11, color: C.warmGray, fontStyle: 'italic', marginTop: 4 }}>AI will auto-summarize your session</div>
              </div>
            )
          })()}
        </div>

        {/* Prescription */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(232,213,188,0.5)', padding: 18, overflow: 'auto' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, color: C.forest, margin: '0 0 12px' }}>💊 Prescription Given</h3>
          {showRx ? (
            <div>
              {p.medicines.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.terracotta, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.warmGray }}>{m.dosage} · {m.duration}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: C.cream, color: C.warmGray }}>{m.timing}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.sandstone}`, paddingTop: 12, marginTop: 8 }}>
                {p.sentVia && (
                  <>
                    <div style={{ fontSize: 10, color: C.warmGray, marginBottom: 6 }}>Sent via:</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>{p.sentVia}</span>
                    </div>
                  </>
                )}
                {(() => {
                  const sentAt = p.sentAt || p.createdAt
                  const sentLabel = sentAt
                    ? new Date(sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : (p.time || p.date || '')
                  return sentLabel ? <div style={{ fontSize: 10, color: C.warmGray, marginTop: 6 }}>Sent {sentLabel}</div> : null
                })()}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 13, color: C.warmGray }}>No prescription yet</div>
              <div style={{ fontSize: 12, color: C.warmGray, fontStyle: 'italic', marginTop: 4 }}>Will appear after consultation</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const shouldShowBanner = activePatient && (() => {
    const history = prescriptionHistory
    const alreadyDone = history.some(
      rx => rx.patientName === activePatient.name
    )
    if (alreadyDone) return false
    return !!activePatient.name
  })()

  return (
    <div style={{ height: 'calc(100vh - 104px)', display: 'flex', flexDirection: 'column', maxWidth: 1500, margin: '0 auto', paddingBottom: 16 }}>
      {shouldShowBanner && <ActiveBanner />}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '30% 40% 30%', gap: 14, minHeight: 0 }}>
        <LeftCol />
        <MiddleCol />
        <RightCol />
      </div>
    </div>
  )
}
