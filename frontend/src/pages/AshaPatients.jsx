import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api, safeParse } from '../utils/api'

export default function AshaPatients() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [ashaNote, setAshaNote] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const res = await api.getPatientsForAsha()
      const list = Array.isArray(res) ? res : []
      const deduped = list.filter((p, idx, arr) => {
        const nameKey = (p?.nameEn || p?.englishName || p?.nameEnglish || p?.name || '').trim().toLowerCase()
        if (!nameKey) return true
        return arr.findIndex((x) => {
          const xName = (x?.nameEn || x?.englishName || x?.nameEnglish || x?.name || '').trim().toLowerCase()
          return xName === nameKey
        }) === idx
      })
      setPatients(deduped)
    } catch (err) {
      toast.error('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  const handleBookConsult = (p) => {
    localStorage.setItem('gd_active_patient', JSON.stringify(p))
    navigate('/app/doctors')
  }

  const handleViewProfile = (p) => {
    setSelectedPatient(p)
    const notes = safeParse(localStorage.getItem('gd_asha_notes'), {})
    setAshaNote(notes[p.id] || '')
  }

  const handleSaveNote = () => {
    if (!selectedPatient) return
    const notes = safeParse(localStorage.getItem('gd_asha_notes'), {})
    notes[selectedPatient.id] = ashaNote
    localStorage.setItem('gd_asha_notes', JSON.stringify(notes))
    toast.success('Note saved!')
  }

  const handleCall = (p) => {
    if (p?.phone) window.location.href = `tel:${p.phone}`
    else toast.error('Phone number not available')
  }

  const getEnglishName = (p) => p?.nameEn || p?.englishName || p?.nameEnglish || p?.name || 'Patient'

  const filtered = patients.filter(p => {
    const matchesSearch = getEnglishName(p).toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    
    if (activeFilter === 'all') return true
    if (activeFilter === 'urgent') return (p.status || '').toLowerCase() === 'urgent'
    if (activeFilter === 'followup') return (p.status || '').toLowerCase() === 'followup'
    if (activeFilter === 'pregnant') return (p.status || '').toLowerCase() === 'pregnant'
    if (activeFilter === 'active') return (p.status || '').toLowerCase() === 'active'
    return true
  })

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'urgent': return '#A32D2D'
      case 'followup': return '#D97706'
      case 'pregnant': return '#7B3FA0'
      default: return '#059669'
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Patients...</div>

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', margin: 0 }}>👥 My Patients</h1>
          <p style={{ fontSize: 16, color: '#6b5e50', margin: '4px 0 0 0' }}>Managing {patients.length} patients in your village</p>
        </div>
        <button 
          onClick={() => navigate('/app/asha-register')}
          style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}
        >
          ➕ Register New
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        <input 
          type="text" 
          placeholder="Search by name or village..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: '1px solid #e8d5bc', fontSize: 15, outline: 'none', background: '#fff' }}
        />
      </div>

      {/* ADDITION 4: Filter Pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {['all', 'urgent', 'followup', 'pregnant', 'active'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              border: activeFilter === filter ? 'none' : '1px solid #e8d5bc',
              background: activeFilter === filter ? '#0f3d2a' : '#fff',
              color: activeFilter === filter ? '#fff' : '#6b5e50',
              cursor: 'pointer',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {filter === 'followup' ? 'Follow-up' : filter}
          </button>
        ))}
      </div>

      {/* Patient Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filtered.length > 0 ? filtered.map((p, i) => (
          <motion.div 
            key={p.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8d5bc', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: getStatusColor(p.status), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                {(getEnglishName(p) || 'P').split(' ').filter(Boolean).map(n => n[0]).join('') || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f3d2a' }}>{getEnglishName(p)}</div>
                    <div style={{ fontSize: 12, color: '#6b5e50' }}>{p.age}Y • {p.gender} • {p.village}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: `${getStatusColor(p.status)}15`, color: getStatusColor(p.status), border: `1px solid ${getStatusColor(p.status)}30`, textTransform: 'uppercase' }}>
                    {p.status}
                  </span>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#6b5e50' }}>
                  Last Consulted: <span style={{ fontWeight: 700 }}>{p.lastConsulted || 'Never'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => handleBookConsult(p)} style={{ flex: 1, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Book Consult</button>
                  <button onClick={() => handleViewProfile(p)} style={{ flex: 1, background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Profile</button>
                  <button onClick={() => handleCall(p)} style={{ width: 36, background: '#fdf6ec', border: '1px solid #e8d5bc', borderRadius: 8, cursor: 'pointer' }}>📞</button>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #e8d5bc' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a' }}>No patients found</div>
            <div style={{ fontSize: 13, color: '#6b5e50', marginTop: 4 }}>Register patients to see them in your dashboard.</div>
          </div>
        )}
      </div>

      {/* ADDITION 5: Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: '#fff', borderRadius: 20, padding: 28, width: 480, maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
            >
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: getStatusColor(selectedPatient.status), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 12px' }}>
                  {(getEnglishName(selectedPatient) || 'P').split(' ').filter(Boolean).map(n => n[0]).join('') || 'P'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f3d2a' }}>{getEnglishName(selectedPatient)}</div>
                <div style={{ fontSize: 13, color: '#6b5e50', marginTop: 4 }}>{selectedPatient.age}Y • {selectedPatient.gender}</div>
                <span style={{ display: 'inline-block', marginTop: 8, fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: `${getStatusColor(selectedPatient.status)}15`, color: getStatusColor(selectedPatient.status), border: `1px solid ${getStatusColor(selectedPatient.status)}30`, textTransform: 'uppercase' }}>
                  {selectedPatient.status}
                </span>
              </div>

              {/* Basic Info */}
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, textTransform: 'uppercase' }}>Basic Info</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div><span style={{ color: '#999' }}>Village:</span> <span style={{ fontWeight: 600, color: '#0f3d2a' }}>{selectedPatient.village}</span></div>
                  <div><span style={{ color: '#999' }}>District:</span> <span style={{ fontWeight: 600, color: '#0f3d2a' }}>{selectedPatient.district || 'N/A'}</span></div>
                  <div><span style={{ color: '#999' }}>Phone:</span> <span style={{ fontWeight: 600, color: '#0f3d2a' }}>{selectedPatient.phone || 'N/A'}</span></div>
                  <div><span style={{ color: '#999' }}>Blood:</span> <span style={{ fontWeight: 600, color: '#0f3d2a' }}>{selectedPatient.bloodGroup || 'N/A'}</span></div>
                </div>
              </div>

              {/* Health Conditions */}
              {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, textTransform: 'uppercase' }}>Health Conditions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedPatient.conditions.map((cond, i) => (
                      <span key={i} style={{ background: '#fff', border: '1px solid #e8d5bc', borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#0f3d2a' }}>
                        {cond}
                      </span>
                    ))}
                  </div>
                  {selectedPatient.isPregnant && (
                    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#7B3FA0' }}>
                      🤰 Week {selectedPatient.weeksPregnant || 'N/A'} of 40
                    </div>
                  )}
                </div>
              )}

              {/* Past Consultations */}
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, textTransform: 'uppercase' }}>Past Consultations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, color: '#6b5e50', padding: '8px', background: '#fff', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, color: '#0f3d2a' }}>Dr. Ramesh Kumar</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>May 1, 2026 • Fever & Cold</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b5e50', padding: '8px', background: '#fff', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, color: '#0f3d2a' }}>Dr. Priya Sharma</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Apr 15, 2026 • Stomach Pain</div>
                  </div>
                </div>
              </div>

              {/* Active Medicines */}
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, textTransform: 'uppercase' }}>Active Medicines</div>
                <div style={{ fontSize: 12, color: '#6b5e50', lineHeight: 1.6 }}>
                  <div>• Paracetamol 500mg - 1-0-1</div>
                  <div>• Azithromycin 250mg - 1-0-0</div>
                </div>
              </div>

              {/* ASHA Notes */}
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, textTransform: 'uppercase' }}>ASHA Notes</div>
                <textarea
                  value={ashaNote}
                  onChange={(e) => setAshaNote(e.target.value)}
                  placeholder="Add notes about this patient..."
                  style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 12, fontFamily: 'Mukta, sans-serif', resize: 'vertical' }}
                />
                <button
                  onClick={handleSaveNote}
                  style={{ marginTop: 10, width: '100%', background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Note
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    handleBookConsult(selectedPatient)
                    setSelectedPatient(null)
                  }}
                  style={{ flex: 1, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  📹 Book Consult
                </button>
                <button
                  onClick={() => {
                    handleCall(selectedPatient)
                    setSelectedPatient(null)
                  }}
                  style={{ flex: 1, background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  📞 Call
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
