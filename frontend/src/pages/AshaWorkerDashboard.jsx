import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api, safeParse } from '../utils/api'
import toast from 'react-hot-toast'

export default function AshaWorkerDashboard() {
  const navigate = useNavigate()
  const user = safeParse(localStorage.getItem('gramdoc_user'), {})
  const userName = user.name || 'ASHA Worker'
  const villageName = user.village || 'Village not set'

  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState([])
  const [pregnancies, setPregnancies] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [pRes, pregRes, vaxRes, repRes] = await Promise.all([
        api.getPatientsForAsha(),
        api.getPregnancyTracker(),
        api.getVaccinationTracker(),
        api.getVillageReport(),
      ])

      setPatients(Array.isArray(pRes) ? pRes : [])
      setPregnancies(Array.isArray(pregRes) ? pregRes : [])
      setVaccinations(Array.isArray(vaxRes) ? vaxRes : [])
      setReport(repRes || null)
    } catch (err) {
      console.error('Failed to load ASHA dashboard:', err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleBookConsult = (p) => {
    localStorage.setItem('gd_active_patient', JSON.stringify(p))
    navigate('/app/doctors')
  }

  const handleCall = (p) => {
    if (p?.phone) window.location.href = `tel:${p.phone}`
    else toast.error('Phone number not available')
  }

  const handleViewProfile = (p) => {
    navigate('/app/patient-profile', { state: { patient: p } })
  }

  const filteredPatients = patients.filter(p => (p?.name || '').toLowerCase().includes(search.toLowerCase()))
  const illnesses = Array.isArray(report?.commonIllnesses) ? report.commonIllnesses : []
  const totalIllnessCount = illnesses.reduce((sum, ill) => sum + Number(ill.count || 0), 0)
  const vaxTotal = vaccinations.length
  const vaxDone = vaccinations.filter(v => (v?.status || '').toLowerCase() === 'done').length
  const vaxCoverage = vaxTotal > 0 ? Math.round((vaxDone / vaxTotal) * 100) : 0

  const totalPatients = patients.length
  const activePregnancies = pregnancies.length
  const dueVaccinations = vaccinations.filter(v => ['due', 'overdue'].includes((v?.status || '').toLowerCase())).length
  const consultationsThisWeek = Number(report?.totalConsultations ?? 0)

  const priorityTasks = patients
    .filter(p => p && typeof p === 'object')
    .map(p => ({ ...p, statusNorm: (p.status || '').toString().toLowerCase() }))
    .filter(p => ['urgent', 'followup', 'follow-up', 'high'].includes(p.statusNorm) || p.statusNorm.includes('urgent') || p.statusNorm.includes('follow'))
    .slice(0, 2)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard…</div>
  }

  return (
    <div style={{ padding: '24px', background: '#fdf6ec', minHeight: '100vh', fontFamily: 'Mukta, sans-serif' }}>
      <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* SECTION 1 — HERO GREETING CARD */}
        <motion.div variants={item} style={{ 
          background: 'linear-gradient(135deg, #7B3FA0, #0f3d2a)', 
          borderRadius: 24, padding: '32px 40px', color: '#fff', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 20px 40px rgba(15,61,42,0.15)', marginBottom: 32, position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 36, margin: 0, fontWeight: 600 }}>Namaste, {userName} 🙏</h1>
            <p style={{ fontSize: 16, opacity: 0.9, marginTop: 8 }}>ASHA Worker — {villageName}</p>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: 20, display: 'inline-block', marginTop: 16, fontSize: 14 }}>
              {totalPatients} patients under your care
            </div>
          </div>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            {/* ADDITION 1: Village Health Score */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }} 
                 transition={{ duration: 2, repeat: Infinity }}
                 style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(123,202,164,0.4)' }} 
               />
               <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', color: '#0f3d2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                 <div style={{ fontFamily: 'Fraunces', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>87</div>
                 <div style={{ fontSize: 14, fontWeight: 700, color: '#7bcaa4' }}>%</div>
               </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
              Village Health Score
            </p>
          </div>
        </motion.div>

        {/* SECTION 2 — TODAY'S PRIORITY TASKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
          <motion.div variants={item} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e8d5bc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
             <h2 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 20, color: '#0f3d2a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
               📋 Today's Tasks
             </h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {priorityTasks.length > 0 ? priorityTasks.map((p, idx) => {
                  const isUrgent = (p.statusNorm || '').includes('urgent') || (p.statusNorm || '').includes('high')
                  return (
                    <div key={p.id || `${p.name}-${idx}`} style={{ borderLeft: `5px solid ${isUrgent ? '#A32D2D' : '#D97706'}`, padding: '16px 20px', background: isUrgent ? '#fef2f2' : '#fffbeb', borderRadius: '0 12px 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ background: isUrgent ? '#A32D2D' : '#D97706', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                          {isUrgent ? '🔴 URGENT' : '🟡 FOLLOW-UP DUE'}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a', marginTop: 8 }}>
                          {(p.name || 'Patient')} {p.age ? `, ${p.age}` : ''}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b5e50' }}>{p.summary || p.notes || 'Needs attention'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => handleBookConsult(p)} style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📹 Book Consult</button>
                        <button onClick={() => handleCall(p)} style={{ background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📞 Call</button>
                      </div>
                    </div>
                  )
                }) : (
                  <div style={{ padding: '18px 18px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0', color: '#6b5e50', fontSize: 13 }}>
                    No priority tasks right now.
                  </div>
                )}
                
                {/* ADDITION 2: Completed Task */}
                <div style={{ borderLeft: '4px solid #1d9e75', padding: '16px 20px', background: 'rgba(29,158,117,0.05)', borderRadius: '0 12px 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ background: '#e8f5ee', color: '#1d9e75', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                      🟢 COMPLETED
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a', marginTop: 8 }}>
                      Registered 2 new patients this morning
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>9:30 AM today</div>
                  </div>
                </div>
             </div>
          </motion.div>

          <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             {/* STATS ROW (4 mini cards in a column for this layout) */}
             {[
               { title: "Total Patients", val: String(totalPatients), sub: "Under your care", icon: "👥", color: "#7B3FA0", trend: totalPatients > 0 ? "↑" : "→" },
               { title: "Consultations", val: String(consultationsThisWeek || 0), sub: "This week", icon: "📹", color: "#0f3d2a", trend: consultationsThisWeek > 0 ? "↑" : "→" },
               { title: "Pregnancies", val: String(activePregnancies), sub: "Active cases", icon: "🤰", color: "#c4653a", trend: activePregnancies > 0 ? "↑" : "→" },
               { title: "Vaccinations", val: String(dueVaccinations), sub: "Due / overdue", icon: "💉", color: "#1d9e75", trend: dueVaccinations > 0 ? "↑" : "→" }
             ].map((s, i) => (
               <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e8d5bc', display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                 <div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                     <div style={{ fontFamily: 'Fraunces', fontSize: 22, fontWeight: 700, color: '#0f3d2a' }}>{s.val}</div>
                     <span style={{ fontSize: 10, color: s.trend === '↑' ? '#059669' : '#A32D2D', fontWeight: 800 }}>{s.trend}</span>
                   </div>
                   <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5e50', textTransform: 'uppercase' }}>{s.title}</div>
                   <div style={{ fontSize: 10, color: '#6b5e50', opacity: 0.7 }}>{s.sub}</div>
                 </div>
               </div>
             ))}
          </motion.div>
        </div>

        {/* ADDITION 3: Incentive Earnings Today */}
        <motion.div variants={item} style={{ background: 'linear-gradient(135deg, #0f3d2a, #1a5c38)', borderRadius: 14, padding: '16px 20px', color: '#fff', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>💰 Today's Incentive Earnings</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7bcaa4', fontFamily: 'Fraunces', fontStyle: 'italic' }}>₹85 earned today</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            <div>Register ₹10 × 2 = ₹20</div>
            <div>Consult ₹15 × 3 = ₹45</div>
            <div>Follow-up ₹5 × 4 = ₹20</div>
          </div>
        </motion.div>

        {/* SECTION 5 — REGISTER NEW PATIENT BUTTON */}
        <motion.div 
          variants={item}
          whileHover={{ background: '#dcfce7', scale: 1.01 }}
          onClick={() => navigate('/app/asha-register')}
          style={{ 
            background: '#EAF3DE', borderRadius: 20, padding: '24px 32px', border: '2px dashed #0f3d2a', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 32, transition: 'all 0.2s'
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f3d2a' }}>➕ Register a New Patient</div>
            <div style={{ fontSize: 14, color: '#0f3d2a', opacity: 0.7 }}>Add a new patient from your village to GramDoc</div>
          </div>
          <div style={{ fontSize: 24, color: '#0f3d2a' }}>→</div>
        </motion.div>

        {/* SECTION 6 — VILLAGE HEALTH SNAPSHOT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <motion.div variants={item} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e8d5bc' }}>
             <h3 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', marginBottom: 20 }}>Common Illnesses this week</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
               {(illnesses.length > 0 ? illnesses : [
                 { label: 'Fever', count: 0, color: '#0f3d2a' },
                 { label: 'Cough/Cold', count: 0, color: '#1d9e75' },
                 { label: 'Stomach issues', count: 0, color: '#D97706' },
                 { label: 'Other', count: 0, color: '#6b5e50' }
               ]).map((ill, i) => (
                 <div key={i}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                     <span>{ill.label}</span>
                     <span>{totalIllnessCount > 0 ? `${Math.round((Number(ill.count || 0) / totalIllnessCount) * 100)}%` : '0%'}</span>
                   </div>
                   <div style={{ height: 10, width: '100%', background: '#f7f3ed', borderRadius: 5, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${totalIllnessCount > 0 ? Math.round((Number(ill.count || 0) / totalIllnessCount) * 100) : 8}%` }} 
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: '100%', background: ill.color || '#6b5e50', borderRadius: 5 }} 
                      />
                   </div>
                 </div>
               ))}
             </div>
             {illnesses.length === 0 && (
               <div style={{ marginTop: 12, fontSize: 11, color: '#6b5e50', fontStyle: 'italic' }}>
                 No illness analytics received yet. Showing placeholder chart.
               </div>
             )}
          </motion.div>

          <motion.div variants={item} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e8d5bc', textAlign: 'center' }}>
             <h3 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', marginBottom: 20 }}>Vaccination Coverage</h3>
             <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                   <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f7f3ed" strokeWidth="3.5" />
                   <motion.circle 
                     cx="18" cy="18" r="15.9" fill="transparent" stroke="#0f3d2a" strokeWidth="3.5" 
                     strokeDasharray="100"
                     initial={{ strokeDashoffset: 100 }}
                     animate={{ strokeDashoffset: 100 - vaxCoverage }}
                     transition={{ duration: 1.5, delay: 0.8 }}
                   />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                   <div style={{ fontSize: 22, fontWeight: 800, color: '#0f3d2a' }}>{vaxCoverage}%</div>
                   <div style={{ fontSize: 8, color: '#6b5e50', textTransform: 'uppercase', fontWeight: 700 }}>Coverage</div>
                </div>
             </div>
             <p style={{ fontSize: 13, color: '#6b5e50' }}>
               <span style={{ color: '#0f3d2a', fontWeight: 700 }}>{100 - vaxCoverage}% pending</span> in village
             </p>
          </motion.div>
        </div>

      </motion.div>
    </div>
  )
}
