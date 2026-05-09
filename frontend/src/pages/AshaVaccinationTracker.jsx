import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api'

export default function AshaVaccinationTracker() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    fetchVaccinations()
  }, [])

  const fetchVaccinations = async () => {
    try {
      setLoading(true)
      const res = await api.getVaccinationTracker()
      setData(Array.isArray(res) ? res : [])
    } catch (err) {
      toast.error('Failed to load vaccination data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkDone = async (id) => {
    try {
      await api.markVaccinationDone(id)
      setData(prev => prev.map(v => v.id === id ? { ...v, status: 'completed' } : v))
      toast.success('Vaccination marked complete ✅')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const filteredData = data.filter(v => {
    if (activeTab === 'All') return true
    if (activeTab === 'Due Today') return v.status === 'due'
    if (activeTab === 'Overdue') return v.status === 'overdue'
    if (activeTab === 'Upcoming') return v.status === 'upcoming'
    if (activeTab === 'Completed') return v.status === 'completed'
    return true
  })

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#059669'
      case 'overdue': return '#A32D2D'
      case 'due': return '#D97706'
      default: return '#6b5e50'
    }
  }

  const schedule = [
    { age: 'Birth', vaccines: 'BCG, OPV-0, Hep B' },
    { age: '6 weeks', vaccines: 'DPT-1, OPV-1, Hep B-2' },
    { age: '10 weeks', vaccines: 'DPT-2, OPV-2' },
    { age: '14 weeks', vaccines: 'DPT-3, OPV-3' },
    { age: '9 months', vaccines: 'Measles' },
    { age: '12 months', vaccines: 'Hep A' },
    { age: '15 months', vaccines: 'MMR, DPT Booster' }
  ]

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Vaccination Data...</div>

  const total = data.length
  const completed = data.filter(v => (v?.status || '').toLowerCase() === 'completed').length
  const coveragePct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', margin: 0 }}>💉 Vaccination Tracker</h1>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>Coverage: {coveragePct}%</span>
            <span style={{ fontSize: 12, color: '#6b5e50' }}>Target: 100%</span>
          </div>
          <div style={{ height: 12, width: '100%', background: '#fdf6ec', borderRadius: 6, overflow: 'hidden', border: '1px solid #e8d5bc' }}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${coveragePct}%` }} 
              transition={{ duration: 1.5 }}
              style={{ height: '100%', background: '#0f3d2a', borderRadius: 6 }} 
            />
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {(() => {
          const due = data.filter(v => (v?.status || '').toLowerCase() === 'due').length
          const overdue = data.filter(v => (v?.status || '').toLowerCase() === 'overdue').length
          const cards = [
            { label: 'Completed', val: completed, color: '#059669', icon: '✅' },
            { label: 'Due', val: due, color: '#D97706', icon: '⏰' },
            { label: 'Overdue', val: overdue, color: '#A32D2D', icon: '❌' },
            { label: 'Coverage', val: `${coveragePct}%`, color: '#0f3d2a', icon: '📊' }
          ]
          return cards.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e8d5bc', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Fraunces' }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b5e50', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
          ))
        })()}
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 10 }}>
        {['All', 'Due Today', 'Overdue', 'Upcoming', 'Completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid #e8d5bc', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab ? '#0f3d2a' : '#fff',
              color: activeTab === tab ? '#fff' : '#0f3d2a',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* VACCINATION LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
        <AnimatePresence mode='popLayout'>
          {filteredData.map((v, i) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                background: v.status === 'completed' ? '#f0fdf4' : '#fff', 
                borderRadius: 16, padding: 20, border: v.status === 'completed' ? '1px solid #86efac' : '1px solid #e8d5bc',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.3s'
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fdf6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👶</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f3d2a' }}>{v.patientName} <span style={{ fontWeight: 400, fontSize: 12, color: '#6b5e50' }}>({v.age})</span></div>
                  <div style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 600, marginTop: 2 }}>{v.vaccine}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase' }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>{v.dueDate}</div>
                </div>
                <div style={{ width: 100 }}>
                  <span style={{ 
                    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 4, 
                    background: `${getStatusColor(v.status)}15`, color: getStatusColor(v.status), 
                    border: `1px solid ${getStatusColor(v.status)}30`, textTransform: 'uppercase' 
                  }}>
                    {v.status}
                  </span>
                </div>
                {v.status !== 'completed' && (
                  <button 
                    onClick={() => handleMarkDone(v.id)}
                    style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✅ Mark Done
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b5e50', fontStyle: 'italic' }}>
            No vaccinations found for this filter.
          </div>
        )}
      </div>

      {/* SCHEDULE REFERENCE */}
      <div style={{ background: '#f7f3ed', borderRadius: 20, border: '1px solid #e8d5bc', overflow: 'hidden' }}>
        <div 
          onClick={() => setShowSchedule(!showSchedule)}
          style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontWeight: 800, color: '#0f3d2a' }}>Standard Vaccination Schedule (India)</span>
          </div>
          <span>{showSchedule ? '▲' : '▼'}</span>
        </div>
        
        <AnimatePresence>
          {showSchedule && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: 'auto' }} 
              exit={{ height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 24px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 12, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#0f3d2a', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: 12 }}>AGE</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: 12 }}>VACCINES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{row.age}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#6b5e50' }}>{row.vaccines}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
