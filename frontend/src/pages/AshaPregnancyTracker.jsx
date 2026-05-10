import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api, safeParse } from '../utils/api'

export default function AshaPregnancyTracker() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [motherVaccinations, setMotherVaccinations] = useState([
    { id: 1, patient: 'Priya Kumari', vaccine: 'TT-1', dueDate: 'May 8', status: 'due' },
    { id: 2, patient: 'Anitha Reddy', vaccine: 'TT-2', dueDate: 'May 15', status: 'upcoming' },
    { id: 3, patient: 'Kavitha Bai', vaccine: 'TT-1', dueDate: 'May 20', status: 'upcoming' }
  ])

  useEffect(() => {
    fetchPregnancies()
  }, [])

  const fetchPregnancies = async () => {
    try {
      setLoading(true)
      const res = await api.getPregnancyTracker()
      setData(Array.isArray(res) ? res : [])
    } catch (err) {
      toast.error('Failed to load pregnancy data')
    } finally {
      setLoading(false)
    }
  }

  const handleBookConsult = (p) => {
    localStorage.setItem('gd_active_patient', JSON.stringify(p))
    navigate('/app/doctors')
  }

  const handleCallPatient = (p) => {
    if (p?.phone) window.location.href = `tel:${p.phone}`
    else toast.error('Phone number not available')
  }

  const cardStyle = {
    background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e8d5bc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: 20
  }

  const badgeStyle = (risk) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    background: risk === 'high' ? '#fef2f2' : risk === 'medium' ? '#fffbeb' : '#f0fdf4',
    color: risk === 'high' ? '#A32D2D' : risk === 'medium' ? '#D97706' : '#059669',
    border: `1px solid ${risk === 'high' ? '#fca5a5' : risk === 'medium' ? '#fcd34d' : '#86efac'}`
  })

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 24, animate: 'pulse' }}>🤰 Loading Pregnancy Data...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', margin: 0 }}>🤰 Pregnancy Tracker</h1>
          <p style={{ fontSize: 16, color: '#6b5e50', margin: '4px 0 0 0' }}>Active cases</p>
        </div>
        <div style={{ background: '#7B3FA0', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>
          {data.length} Active
        </div>
      </div>

      {/* SUMMARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {(() => {
          const highRisk = data.filter(p => (p?.riskLevel || '').toLowerCase() === 'high').length
          const ancDue = data.filter(p => Boolean(p?.nextANC)).length
          const summary = [
            { label: 'Active Cases', val: data.length, icon: '🤰', color: '#7B3FA0' },
            { label: 'ANC Scheduled', val: ancDue, icon: '📅', color: '#0f3d2a' },
            { label: 'High Risk', val: highRisk, icon: '⚠️', color: '#A32D2D' }
          ]
          return summary.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8d5bc', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f3d2a', fontFamily: 'Fraunces' }}>{s.val}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          </div>
          ))
        })()}
      </div>

      {/* PREGNANCY CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
        {data.length === 0 && (
          <div style={{ padding: '46px 20px', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px dashed #e8d5bc', color: '#6b5e50' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🤰</div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a' }}>No pregnancy cases found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>If this is unexpected, check that patients are marked pregnant during registration.</div>
          </div>
        )}
        {data.map((p, i) => {
          const progress = (p.weeksPregnant / 40) * 100
          const barColor = p.riskLevel === 'high' ? '#A32D2D' : p.riskLevel === 'medium' ? '#D97706' : '#059669'
          
          return (
            <motion.div 
              key={p.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 }}
              style={cardStyle}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: 32 }}>
                
                {/* Left Section */}
                <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f3d2a' }}>{p.name}, {p.age}F</div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      <span style={{ color: '#0f3d2a' }}>Week {p.weeksPregnant} of 40</span>
                      <span style={{ color: '#6b5e50' }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 10, width: '100%', background: '#f7f3ed', borderRadius: 5, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${progress}%` }} 
                        transition={{ duration: 1 }}
                        style={{ height: '100%', background: barColor, borderRadius: 5 }} 
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 13, color: '#6b5e50' }}>
                    📅 Due Date: <span style={{ fontWeight: 700, color: '#0f3d2a' }}>{p.dueDate}</span>
                  </div>
                </div>

                {/* Middle Section — ANC Schedule */}
                <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase', marginBottom: 12 }}>ANC Checkup Schedule</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                      <span>✅</span> 1st ANC — Week 8 — <span style={{ fontWeight: 800 }}>Done</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: p.weeksPregnant >= 16 ? '#059669' : '#6b5e50', fontWeight: 600 }}>
                      <span>{p.weeksPregnant >= 16 ? '✅' : '○'}</span> 2nd ANC — Week 16 — <span style={{ fontWeight: 800 }}>{p.weeksPregnant >= 16 ? 'Done' : 'Upcoming'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: p.weeksPregnant >= 24 ? '#D97706' : '#6b5e50', fontWeight: 600 }}>
                      <span>{p.weeksPregnant >= 24 ? '🟡' : '○'}</span> 3rd ANC — Week 24 — <span style={{ fontWeight: 800 }}>{p.weeksPregnant >= 24 ? `Due ${p.nextANC}` : 'Upcoming'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6b5e50', opacity: 0.5 }}>
                      <span>○</span> 4th ANC — Week 32 — Upcoming
                    </div>
                  </div>
                </div>

                {/* Right Section — Actions */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={badgeStyle(p.riskLevel)}>{p.riskLevel} Risk</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    <button onClick={() => handleBookConsult(p)} style={{ width: '100%', background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📹 Book ANC Consult</button>
                    <button onClick={() => handleCallPatient(p)} style={{ width: '100%', background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📞 Call Patient</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 12 }}>Last visited: 2 weeks ago</div>
                </div>

              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ADDITION 7: Mother Vaccination Schedule */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 20 }}>💉 Vaccination Schedule for Mothers</h2>
        
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8d5bc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8d5bc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase' }}>Patient</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase' }}>Vaccine</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#6b5e50', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {motherVaccinations.map((vax, i) => (
                <tr key={vax.id} style={{ borderBottom: i < motherVaccinations.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={{ padding: '14px', fontSize: 14, fontWeight: 600, color: '#0f3d2a' }}>{vax.patient}</td>
                  <td style={{ padding: '14px', fontSize: 13, color: '#6b5e50' }}>{vax.vaccine}</td>
                  <td style={{ padding: '14px', fontSize: 13, color: '#6b5e50' }}>{vax.dueDate}</td>
                  <td style={{ padding: '14px' }}>
                    {vax.status === 'done' ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1d9e75' }}>Done ✅</span>
                    ) : vax.status === 'due' ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Due</span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#999' }}>Upcoming</span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {vax.status !== 'done' && vax.status === 'due' && (
                      <button
                        onClick={() => {
                          toast.success('💉 Vaccination marked! ₹20 credited to your account')
                          const earnings = safeParse(localStorage.getItem('gd_asha_earnings'), { today: 0, total: 0 })
                          earnings.today += 20
                          earnings.total += 20
                          localStorage.setItem('gd_asha_earnings', JSON.stringify(earnings))
                          
                          setMotherVaccinations(prev => prev.map(v => 
                            v.id === vax.id ? { ...v, status: 'done' } : v
                          ))
                        }}
                        style={{
                          background: '#0f3d2a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vaccinations are tracked in the dedicated Vaccination Tracker tab */}

    </div>
  )
}
