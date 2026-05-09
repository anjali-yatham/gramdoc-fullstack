import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api'

export default function AshaPatients() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')

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
    navigate('/app/patient-profile', { state: { patient: p } })
  }

  const handleCall = (p) => {
    if (p?.phone) window.location.href = `tel:${p.phone}`
    else toast.error('Phone number not available')
  }

  const getEnglishName = (p) => p?.nameEn || p?.englishName || p?.nameEnglish || p?.name || 'Patient'

  const filtered = patients.filter(p => getEnglishName(p).toLowerCase().includes(search.toLowerCase()))

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
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        <input 
          type="text" 
          placeholder="Search by name or village..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: '1px solid #e8d5bc', fontSize: 15, outline: 'none', background: '#fff' }}
        />
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
    </div>
  )
}
