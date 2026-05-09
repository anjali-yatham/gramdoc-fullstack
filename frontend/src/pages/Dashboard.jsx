import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, safeParse } from '../utils/api'
import toast from 'react-hot-toast'
import { LANGS } from '../utils/translations'

export default function Dashboard() {
  const nav = useNavigate()
  const [stats, setStats] = useState({ doctorsOnline:0, patientsToday:0, avgWaitMinutes:0, upcomingFollowUp:null, healthTip:'' })
  const [doctors, setDoctors] = useState([])
  const [ambulanceStopped, setAmbulanceStopped] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [familyProfiles, setFamilyProfiles] = useState([])
  const [newMember, setNewMember] = useState({ name: '', age: '', relation: 'Self' })
  const [medicinesTaken, setMedicinesTaken] = useState({})
  const [dismissedAlert, setDismissedAlert] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const deferredPromptRef = useRef(null)
  const user = safeParse(localStorage.getItem('gramdoc_user'), {})
  const lang = localStorage.getItem('gramdoc_lang') || 'en'
  const t = LANGS[lang]?.ui || LANGS.en.ui
  const getTakenKey = (dateString, index) => `gd_medicine_taken_${dateString}_${index}`

  const moods = [
    { icon:'🤒', label:t.fever || 'Fever', color:'#FAECE7', border:'#f0c9b8' },
    { icon:'🤕', label:t.pain || 'Pain',  color:'#FEF3CD', border:'#f0d98c' },
    { icon:'😮‍💨', label:t.cough || 'Cough', color:'#E8F0FE', border:'#b8cef8' },
    { icon:'😟', label:t.other || 'Other', color:'var(--mint-pale)', border:'#b5dcca' },
  ]

  useEffect(()=>{
    api.getDashboard().then(setStats).catch(()=>{})
    api.getDoctors({ available: true }).then(setDoctors).catch(()=>{})

    // Load medicines taken state using per-medicine keys.
    const today = new Date().toDateString()
    const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
    const lastRx = history[0] || null
    const taken = {}
    if (Array.isArray(lastRx?.medicines)) {
      lastRx.medicines.slice(0, 3).forEach((_, idx) => {
        taken[idx] = localStorage.getItem(getTakenKey(today, idx)) === 'true'
      })
    }
    setMedicinesTaken(taken)

    // Check if alert is dismissed for today
    const dismissedToday = localStorage.getItem('gd_alert_dismissed')
    if (dismissedToday === today) {
      setDismissedAlert(true)
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const installDismissed = localStorage.getItem('gd_install_dismissed') === 'true'

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      if (!isStandalone && !installDismissed && user.role === 'patient') {
        setShowInstall(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  },[])

  useEffect(() => {
    const profiles = safeParse(localStorage.getItem('gd_family_profiles'), [])
    setFamilyProfiles(Array.isArray(profiles) ? profiles : [])
  }, [])

  const followDate = stats.upcomingFollowUp ? new Date(stats.upcomingFollowUp.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''
  const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const persistProfiles = (profiles) => {
    localStorage.setItem('gd_family_profiles', JSON.stringify(profiles))
    setFamilyProfiles(profiles)
  }

  const handleSelectProfile = (profile) => {
    const current = safeParse(localStorage.getItem('gramdoc_user'), {})
    const nextUser = {
      ...current,
      name: profile.name,
      age: profile.age,
      relation: profile.relation,
      role: current.role || 'patient'
    }
    localStorage.setItem('gramdoc_user', JSON.stringify(nextUser))
    localStorage.setItem('gramdoc_active_profile', JSON.stringify(profile))
    window.location.reload()
  }

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.age) {
      toast.error(lang === 'hi' ? 'कृपया नाम और उम्र जोड़ें' : lang === 'te' ? 'దయచేసి పేరు మరియు వయస్సు ఇవ్వండి' : 'Please add name and age')
      return
    }
    const profile = {
      id: `FAM-${Date.now()}`,
      name: newMember.name.trim(),
      age: newMember.age,
      relation: newMember.relation
    }
    const updated = [...familyProfiles, profile]
    persistProfiles(updated)
    setNewMember({ name: '', age: '', relation: 'Self' })
    setShowAddMember(false)
  }

  const handleEmergencySOS = () => {
    const callEmergency = () => {
      window.open('tel:108')
      toast.success(lang === 'hi' ? 'आपातकालीन सेवाओं से संपर्क किया गया!' : lang === 'te' ? 'అత్యవసర సేవలను సంప్రదించాం!' : 'Emergency services contacted!')
    }
    if (!navigator.geolocation) {
      callEmergency()
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const msg = `EMERGENCY: Patient needs help. Location: ${lat},${lng}`
        const whatsappLink = `https://wa.me/+911800108?text=${encodeURIComponent(msg)}`
        window.open(whatsappLink, '_blank')
        callEmergency()
      },
      () => {
        callEmergency()
      }
    )
  }

  return (
    <div style={{ maxWidth:960, margin:'0 auto', position: 'relative' }}>
      <button
        onClick={() => setShowSwitcher(true)}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          border: '1px solid #e8d5bc',
          background: '#fff',
          borderRadius: 999,
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f3d2a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
          {initials}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f3d2a' }}>
          {lang === 'hi' ? 'उपयोगकर्ता बदलें' : lang === 'te' ? 'వినియోగదారుని మార్చండి' : 'Switch User'}
        </span>
      </button>

      {/* Greeting */}
      <div style={{ background:'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)', borderRadius:20, padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:160, height:160, borderRadius:'50%', background:'rgba(123,202,164,0.12)' }}/>
        <div style={{ position:'absolute', right:60, bottom:-40, width:100, height:100, borderRadius:'50%', background:'rgba(123,202,164,0.08)' }}/>
        <p style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginBottom:4 }}>{t.goodMorning || 'Good morning'} 🌤️</p>
        <h2 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:26, color:'#fff', marginBottom:6 }}>{t.howFeeling || 'How are you feeling today'}, {user.name || 'Friend'}?</h2>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:20 }}>{t.tellSymptoms || "Tell us your symptoms — we'll connect you with the right doctor."}</p>
        <button onClick={()=>nav('/app/voice-triage')} style={{ background:'var(--mint)', color:'var(--forest)', border:'none', borderRadius:10, padding:'11px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          {t.talkDoctor || 'Talk to Doctor Now'} →
        </button>
      </div>

      {/* ADDITION 1: Health Snapshot - 3 Cards */}
      {(() => {
        const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
        const lastRx = history[0] || null
        const now = new Date()
        const daysAgo = (date) => {
          const ms = now - new Date(date)
          const days = Math.floor(ms / (1000*60*60*24))
          return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
        }
        const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric' })
        
        return (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>
            {/* Card 1: Active Medicines */}
            <div onClick={()=>nav('/app/prescriptions')} style={{ background:'#fff', borderRadius:14, padding:'20px', border:'0.5px solid #e8d5bc', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#d4f1e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>💊</div>
              <div style={{ fontSize:11, color:'#999', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Active Medicines</div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:24, color:'#0f3d2a', fontWeight:700, marginBottom:2 }}>{`${lastRx?.medicines?.length || 0} medicines`}</div>
              <div style={{ fontSize:11, color:'#999' }}>from last prescription</div>
            </div>

            {/* Card 2: Next Follow-up */}
            <div onClick={()=>nav('/app/prescriptions')} style={{ background:'#fff', borderRadius:14, padding:'20px', border:'0.5px solid #e8d5bc', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#e8f0e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>📅</div>
              <div style={{ fontSize:11, color:'#999', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Next Follow-up</div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:24, color:'#0f3d2a', fontWeight:700, marginBottom:2 }}>{lastRx?.followUpDate ? formatDate(lastRx.followUpDate) : 'Not scheduled'}</div>
              <div style={{ fontSize:11, color:'#999' }}>{lastRx?.doctor?.name || 'No doctor info'}</div>
            </div>

            {/* Card 3: Last Prescription */}
            <div onClick={()=>nav('/app/prescriptions')} style={{ background:'#fff', borderRadius:14, padding:'20px', border:'0.5px solid #e8d5bc', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#f5e6d3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:11, color:'#999', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Last Prescription</div>
              <div style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:24, color:'#0f3d2a', fontWeight:700, marginBottom:2 }}>{lastRx?.createdAt ? daysAgo(lastRx.createdAt) : 'No prescriptions'}</div>
              <div style={{ fontSize:11, color:'#999' }}>{lastRx?.doctor?.specialization || 'Doctor'}</div>
            </div>
          </div>
        )
      })()}

      {/* ADDITION 2: Medicine Reminders */}
      {(() => {
        const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
        const lastRx = history[0] || null
        const today = new Date().toDateString()
        const hour = new Date().getHours()
        let currentTimeSlot = 'Morning'
        if (hour >= 12 && hour < 18) currentTimeSlot = 'Afternoon'
        else if (hour >= 18) currentTimeSlot = 'Night'

        const toggleMedicineTaken = (idx) => {
          const key = getTakenKey(today, idx)
          const current = localStorage.getItem(key)
          const newState = !current
          if (newState) localStorage.setItem(key, 'true')
          else localStorage.removeItem(key)
          setMedicinesTaken(prev => ({ ...prev, [idx]: newState }))
        }

        return (
          <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'0.5px solid #e8d5bc', borderLeft:'4px solid #0f3d2a', marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f3d2a' }}>💊 Today's Medicines</div>
              <div style={{ fontSize:11, color:'#999' }}>{new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</div>
            </div>

            {!lastRx ? (
              <div style={{ fontSize:13, color:'#666', lineHeight:1.6 }}>
                No active medicines. Medicines from your prescription will appear here.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {(lastRx.medicines || []).slice(0, 3).map((med, idx) => {
                  const isTaken = medicinesTaken[idx]
                  const isCurrentTime = med.timing === currentTimeSlot
                  let status = 'Pending'
                  let statusColor = '#999'
                  if (isTaken) { status = '✓ Taken'; statusColor = '#1d9e75' }
                  else if (isCurrentTime) { status = '⏰ Due Now'; statusColor = '#f59e0b' }

                  return (
                    <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'#f9f9f9', borderRadius:10 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#0f3d2a' }}>{med.name || med}</div>
                        <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{currentTimeSlot}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:statusColor, padding:'4px 8px', background:statusColor === '#1d9e75' ? '#d4f1e8' : statusColor === '#f59e0b' ? '#fef3cd' : '#efefef', borderRadius:6, animation: status === '⏰ Due Now' ? 'pulseDue 1.5s ease-in-out infinite' : 'none' }}>
                          {status}
                        </div>
                        <button onClick={()=>toggleMedicineTaken(idx)} style={{ border:'none', background:isTaken ? '#1d9e75' : '#ddd', color:'#fff', borderRadius:6, padding:'6px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                          {isTaken ? '✓' : '○'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ADDITION 3: Village Health Alert */}
      {!dismissedAlert && (
        (() => {
          const today = new Date().toDateString()
          return (
            <div style={{ background:'#FEF3CD', borderRadius:14, padding:'16px 20px', border:'1px solid #f0d98c', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#854F0B' }}>🚨 Health Alert</div>
                <div style={{ fontSize:11, color:'#6b5e50', marginTop:2 }}>{user?.village || 'Telangana'}</div>
                <div style={{ fontSize:12, color:'#854F0B', marginTop:8, lineHeight:1.5 }}>
                  Dengue cases rising this week. Use mosquito nets. Check for fever and joint pain early.
                </div>
                <div style={{ fontSize:10, color:'#999', marginTop:6 }}>— Telangana Health Dept • Today</div>
              </div>
              <button onClick={() => {
                localStorage.setItem('gd_alert_dismissed', today)
                setDismissedAlert(true)
              }} style={{ border:'none', background:'transparent', fontSize:20, cursor:'pointer', padding:0, color:'#854F0B' }}>
                ✕
              </button>
            </div>
          )
        })()
      )}

      {/* ADDITION 4: PWA Install Banner */}
      {showInstall && user.role === 'patient' && (
        <div style={{ background:'#0f3d2a', borderRadius:12, padding:'12px 16px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>📱 Install GramDoc on your phone</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:4 }}>Access offline, get medicine reminders</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => {
              if (deferredPromptRef.current) {
                deferredPromptRef.current.prompt()
                deferredPromptRef.current = null
                setShowInstall(false)
              }
            }} style={{ border:'1px solid #fff', background:'transparent', color:'#fff', borderRadius:8, padding:'8px 14px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
              Install
            </button>
            <button onClick={() => {
              localStorage.setItem('gd_install_dismissed', 'true')
              setShowInstall(false)
            }} style={{ border:'none', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:18, cursor:'pointer', padding:0 }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mood tiles */}
      <p style={{ fontSize:12, color:'var(--warm-gray)', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t.problemPrompt || 'What seems to be the problem?'}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        {moods.map(m=>(
          <div key={m.label} onClick={()=>nav('/app/voice-triage')} style={{ background:m.color, border:`1px solid ${m.border}`, borderRadius:14, padding:'20px 12px', textAlign:'center', cursor:'pointer', transition:'transform 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>
            <div style={{ fontSize:28, marginBottom:6 }}>{m.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--forest)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Stats + Follow-up */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>
        {[{ label:t.doctorsOnline || 'Doctors Online', value:stats.doctorsOnline || 0, icon:'🟢', sub:t.availableNow || 'Available now' },
          { label:t.avgWait || 'Avg Wait Time', value:`${stats.avgWaitMinutes || 0} min`, icon:'⏱️', sub:t.todayAvg || "Today's average" },
          { label:t.patientsToday || 'Patients Today', value:stats.patientsToday || 0, icon:'👥', sub:t.servedSoFar || 'Served so far' }].map(s=>(
              <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'0.5px solid var(--sandstone)' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--forest)', fontWeight:600 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--warm-gray)', marginTop:2 }}>{s.label}</div>
                  <div style={{ fontSize:10, color:'#aaa', marginTop:1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Follow-up + Health tip */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {stats.upcomingFollowUp && (
          <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'0.5px solid var(--sandstone)' }}>
            <div style={{ fontSize:11, color:'var(--warm-gray)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.07em' }}>📅 {t.upcomingFollowUp || 'Upcoming Follow-Up'}</div>
            <div style={{ fontWeight:700, color:'var(--forest)', fontSize:15 }}>{stats.upcomingFollowUp.doctor}</div>
            <div style={{ fontSize:12, color:'var(--warm-gray)', marginTop:3 }}>{stats.upcomingFollowUp.type} · {followDate}</div>
            <button onClick={() => nav('/app/prescriptions')} style={{ marginTop:12, background:'var(--mint-pale)', color:'#3B6D11', border:'none', borderRadius:8, padding:'7px 14px', fontSize:11, fontWeight:600, cursor:'pointer' }}>{t.viewDetails || 'View Details'}</button>
          </div>
        )}
        <div style={{ background:'var(--mint-pale)', borderRadius:14, padding:'20px', border:'1px solid #b5dcca', gridColumn: stats.upcomingFollowUp ? 'auto' : 'span 2' }}>
          <div style={{ fontSize:11, color:'#3B6D11', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.07em' }}>💡 {t.dailyTip || 'Daily Health Tip'}</div>
          <div style={{ fontSize:13, color:'var(--forest)', lineHeight:1.6 }}>{stats.healthTip || 'Drink at least 8 glasses of water daily to stay healthy.'}</div>
        </div>
      </div>

      {showSwitcher && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, border: '1px solid #e8d5bc', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a' }}>
                {lang === 'hi' ? 'यह डिवाइस कौन उपयोग कर रहा है?' : lang === 'te' ? 'ఈ పరికరాన్ని ఎవరు ఉపయోగిస్తున్నారు?' : "Who's using this device?"}
              </div>
              <button onClick={() => { setShowSwitcher(false); setShowAddMember(false) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
              {familyProfiles.map((profile) => (
                <button
                  key={profile.id || `${profile.name}-${profile.age}`}
                  onClick={() => handleSelectProfile(profile)}
                  style={{ border: '1px solid #e8d5bc', background: '#fff', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#0f3d2a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {(profile.name || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{profile.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: '#6b5e50' }}>{profile.age} yrs · {profile.relation}</span>
                  </span>
                </button>
              ))}
              {familyProfiles.length === 0 && (
                <div style={{ fontSize: 12, color: '#6b5e50', padding: '8px 2px' }}>
                  {lang === 'hi' ? 'कोई परिवार प्रोफ़ाइल सहेजी नहीं गई है।' : lang === 'te' ? 'కుటుంబ ప్రొఫైళ్లు ఇంకా సేవ్ కాలేదు.' : 'No family profiles saved yet.'}
                </div>
              )}
            </div>

            {showAddMember ? (
              <div style={{ border: '1px solid #e8d5bc', borderRadius: 10, padding: 10, marginBottom: 10, display: 'grid', gap: 8 }}>
                <input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder={lang === 'hi' ? 'नाम' : lang === 'te' ? 'పేరు' : 'Name'}
                  style={{ border: '1px solid #e8d5bc', borderRadius: 8, padding: 8, fontSize: 12 }}
                />
                <input
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  placeholder={lang === 'hi' ? 'उम्र' : lang === 'te' ? 'వయస్సు' : 'Age'}
                  type="number"
                  style={{ border: '1px solid #e8d5bc', borderRadius: 8, padding: 8, fontSize: 12 }}
                />
                <select
                  value={newMember.relation}
                  onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                  style={{ border: '1px solid #e8d5bc', borderRadius: 8, padding: 8, fontSize: 12, background: '#fff' }}
                >
                  <option>{lang === 'hi' ? 'स्वयं' : lang === 'te' ? 'స్వయం' : 'Self'}</option>
                  <option>{lang === 'hi' ? 'पति/पत्नी' : lang === 'te' ? 'భార్య/భర్త' : 'Spouse'}</option>
                  <option>{lang === 'hi' ? 'बच्चा' : lang === 'te' ? 'పిల్ల' : 'Child'}</option>
                  <option>{lang === 'hi' ? 'माता/पिता' : lang === 'te' ? 'తల్లి/తండ్రి' : 'Parent'}</option>
                </select>
                <button onClick={handleAddMember} style={{ border: 'none', borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, background: '#0f3d2a', color: '#fff', cursor: 'pointer' }}>
                  {lang === 'hi' ? 'परिवार सदस्य सहेजें' : lang === 'te' ? 'కుటుంబ సభ్యుని సేవ్ చేయండి' : 'Save family member'}
                </button>
              </div>
            ) : null}

            <button
              onClick={() => setShowAddMember(v => !v)}
              style={{ width: '100%', border: '1px solid #0f3d2a', background: '#fff', color: '#0f3d2a', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {lang === 'hi' ? 'परिवार सदस्य जोड़ें' : lang === 'te' ? 'కుటుంబ సభ్యుని జోడించండి' : 'Add family member'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleEmergencySOS}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: '#dc2626',
          color: '#fff',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)'
        }}
        title="Emergency SOS"
      >
        📞
      </button>

      <div
        style={{
          position: 'fixed', bottom: '20px', left: 0, right: 0,
          height: '120px', background: 'transparent', border: 'none',
          zIndex: 999, overflow: 'visible', pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end'
        }}
      >
        <div
          style={{
            pointerEvents: 'auto', display: 'flex', alignItems: 'center', cursor: 'pointer',
            animation: ambulanceStopped ? 'none' : 'driveAcross 10s linear infinite',
            transform: ambulanceStopped ? 'translateX(50vw)' : undefined
          }}
          onClick={() => {
            if (ambulanceStopped) {
              window.open('tel:108')
              setAmbulanceStopped(false)
            } else {
              setAmbulanceStopped(true)
              setTimeout(() => setAmbulanceStopped(false), 5000)
            }
          }}
        >
          <div
            style={{
              background: 'rgba(163,45,45,0.92)',
              borderRadius: '12px',
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginRight: 8
            }}
          >
            <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>
              అత్యవసరం • आपातकाल • Emergency
            </span>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', height: '16px' }} />
            <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>
              108
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open('tel:108')
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '3px 10px',
                color: 'white',
                fontSize: '10px',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '10px' }}>📞</span> Call
            </button>
          </div>
          <div style={{ fontSize: '40px', lineHeight: 1, transform: 'scaleX(-1)' }}>🚑</div>
        </div>
      </div>

      <style>{`
        @keyframes pulseDue {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        @keyframes driveAcross {
          0% { transform: translateX(-600px); }
          100% { transform: translateX(calc(100vw + 600px)); }
        }
      `}</style>
    </div>
  )
}
