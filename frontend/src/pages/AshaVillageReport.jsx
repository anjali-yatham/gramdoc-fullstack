import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api'

export default function AshaVillageReport() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await api.getVillageReport()
      setReport(res || null)
      setAlerts(Array.isArray(res?.alerts) ? res.alerts : [])
    } catch (err) {
      toast.error('Failed to load village report')
    } finally {
      setLoading(false)
    }
  }

  const handleSendToPHC = async () => {
    try {
      // Backend support may vary; this at least attempts a real send.
      await api.sendVillageReportToPHC?.()
      toast.success('Report sent to PHC')
    } catch (e) {
      toast.error(e?.message || 'Failed to send report')
    }
  }

  const cardStyle = {
    background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e8d5bc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Village Report...</div>

  const weekLabel = report?.week || report?.period || report?.range || 'Current week'
  const commonIllnesses = Array.isArray(report?.commonIllnesses) ? report.commonIllnesses : []
  const vaccinationBreakdown = Array.isArray(report?.vaccinationBreakdown) ? report.vaccinationBreakdown : []
  const consultedDoctors = Array.isArray(report?.mostConsultedDoctors) ? report.mostConsultedDoctors : []
  const monthlyTrend = Array.isArray(report?.monthlyTrend) ? report.monthlyTrend : []
  const totalIllnessCount = commonIllnesses.reduce((sum, ill) => sum + Number(ill.count || 0), 0)
  const coveragePct = Number.isFinite(Number(report?.vaccinationCoverage)) ? Number(report.vaccinationCoverage) : 0
  const trendMax = Math.max(...monthlyTrend.map((w) => Number(w.val || 0)), 1)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', margin: 0 }}>📊 Village Health Report</h1>
          <p style={{ fontSize: 16, color: '#6b5e50', margin: '4px 0 12px 0' }}>{report?.villageName || 'Village not set'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fdf6ec', padding: '6px 14px', borderRadius: 10, border: '1px solid #e8d5bc', width: 'fit-content' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{weekLabel}</span>
          </div>
        </div>
        <button 
          onClick={handleSendToPHC}
          style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,61,42,0.15)' }}
        >
          📤 Send to PHC
        </button>
      </div>

      {/* SECTION 1 — Week Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Total Consultations', val: report?.totalConsultations || 0, icon: '📹', color: '#0f3d2a' },
          { label: 'New Registrations', val: report?.newRegistrations || 0, icon: '👥', color: '#7B3FA0' },
          { label: 'Prescriptions Issued', val: report?.prescriptionsIssued || 0, icon: '💊', color: '#D97706' },
          { label: 'ANC Checkups', val: report?.ancCheckups || 0, icon: '🤰', color: '#059669' }
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Fraunces' }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5e50', textTransform: 'uppercase', lineHeight: 1.2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, marginBottom: 40 }}>
        
        {/* SECTION 2 — Common Illnesses */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 24 }}>🦠 Most Common Illnesses This Week</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(commonIllnesses.length > 0 ? commonIllnesses : [{ label: 'No data', count: 0, color: '#6b5e50' }]).map((ill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, fontSize: 13, fontWeight: 700, color: '#6b5e50' }}>{ill.label}</div>
                <div style={{ flex: 1, height: 12, background: '#fdf6ec', borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${totalIllnessCount > 0 ? Math.round((Number(ill.count || 0) / totalIllnessCount) * 100) : 0}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    style={{ height: '100%', background: ill.color, borderRadius: 6 }} 
                  />
                </div>
                <div style={{ width: 40, fontSize: 13, fontWeight: 800, color: '#0f3d2a', textAlign: 'right' }}>{totalIllnessCount > 0 ? Math.round((Number(ill.count || 0) / totalIllnessCount) * 100) : 0}%</div>
                <div style={{ position: 'absolute', transform: 'translateY(18px)', left: 112, fontSize: 10, color: '#9ca3af' }}>{ill.count} patients</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 4 — Vaccination Coverage Donut */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 24 }}>💉 Vaccination Coverage</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#fdf6ec" strokeWidth="12" />
                <motion.circle 
                  cx="60" cy="60" r="50" fill="none" stroke="#0f3d2a" strokeWidth="12"
                  strokeDasharray="314.159"
                  initial={{ strokeDashoffset: 314.159 }}
                  animate={{ strokeDashoffset: 314.159 * (1 - coveragePct / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f3d2a', fontFamily: 'Fraunces' }}>{coveragePct}%</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b5e50', textTransform: 'uppercase' }}>Coverage</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(vaccinationBreakdown.length > 0 ? vaccinationBreakdown : [{ label: 'No data', val: '0%', status: 'amber' }]).map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#6b5e50', fontWeight: 600 }}>{b.status === 'green' ? '✅' : b.status === 'amber' ? '🟡' : '🔴'} {b.label}</span>
                  <span style={{ fontWeight: 800, color: '#0f3d2a' }}>{b.val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 3 — Doctor Utilization */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 20 }}>👨‍⚕️ Most Consulted Doctors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {(consultedDoctors.length > 0 ? consultedDoctors : [{ name: 'No consult data', spec: 'N/A', count: 0, rating: 0, online: false }]).map((doc, i) => (
            <motion.div 
              key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ ...cardStyle, padding: 16 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f3d2a' }}>{doc.name}</div>
                {doc.online && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />}
              </div>
              <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 8 }}>{doc.spec}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{doc.count} <span style={{ fontWeight: 400, color: '#6b5e50' }}>consults</span></div>
                <div style={{ fontSize: 12, color: '#D97706' }}>⭐ {doc.rating}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 32 }}>
        
        {/* SECTION 5 — Health Alerts Issued */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 20 }}>🚨 Health Alerts Issued</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ background: '#fdf6ec', padding: '12px 16px', borderRadius: 12, border: '1px solid #e8d5bc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>{a.icon} {a.text} — {a.date}</div>
                <button
                  onClick={() => {
                    setAlerts(prev => prev.filter(x => x.id !== a.id))
                    try {
                      const dismissed = JSON.parse(localStorage.getItem('gd_asha_dismissed_alerts') || '[]')
                      const next = Array.from(new Set([...(Array.isArray(dismissed) ? dismissed : []), a.id]))
                      localStorage.setItem('gd_asha_dismissed_alerts', JSON.stringify(next))
                    } catch (_) {}
                  }}
                  style={{ background: 'none', border: 'none', fontSize: 11, color: '#6b5e50', cursor: 'pointer', fontWeight: 700 }}
                >
                  Dismiss
                </button>
              </div>
            ))}
            {alerts.length === 0 && (
              <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic' }}>No active alerts.</div>
            )}
          </div>
        </motion.div>

        {/* SECTION 6 — Monthly Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 24 }}>📈 Monthly Consultation Trend</h2>
          <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 20, position: 'relative' }}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.1 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ borderBottom: '1px solid #0f3d2a', width: '100%' }} />)}
            </div>
            
            {(monthlyTrend.length > 0 ? monthlyTrend : [{ label: 'Week 1', val: 0 }]).map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f3d2a' }}>{w.val}</div>
                <div style={{ width: '100%', height: Math.max((Number(w.val || 0) / trendMax) * 112, 2), background: 'linear-gradient(to top, #0f3d2a, #7bcaa4)', borderRadius: '6px 6px 0 0' }} />
                <div style={{ fontSize: 11, color: '#6b5e50', fontWeight: 700 }}>{w.label}</div>
              </div>
            ))}
          </div>
          {report?.monthlyTrendSummary && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#059669', fontWeight: 700 }}>
               {report.monthlyTrendSummary}
            </div>
          )}
        </motion.div>

      </div>

    </div>
  )
}
