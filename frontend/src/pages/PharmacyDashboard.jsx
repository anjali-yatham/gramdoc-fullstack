import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { api } from '../utils/api'

const cards = [
  { label: 'Orders Today', value: '12' },
  { label: 'Pending Orders', value: '3' },
  { label: 'Revenue Today', value: '₹2,400' },
  { label: 'Medicines in Stock', value: '847' },
]

export default function PharmacyDashboard() {
  const user = useMemo(() => api.getUser() || {}, [])
  const displayName = user?.name || 'Pharmacy'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f3ed', fontFamily: 'Mukta, sans-serif' }}>
      <aside style={{ width: 228, minWidth: 228, background: '#0f3d2a', color: '#fff', padding: '28px 22px' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 600 }}>GramDoc</div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em' }}>PHARMACY</div>
      </aside>

      <main style={{ flex: 1, padding: 32 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e8d5bc', padding: 28, boxShadow: '0 10px 30px rgba(15,61,42,0.06)' }}>
            <h1 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 32, color: '#2d5fa3' }}>💊 Pharmacy Dashboard</h1>
            <p style={{ marginTop: 10, fontSize: 14, color: '#6b5e50' }}>Welcome {displayName}</p>
            <p style={{ marginTop: 6, fontSize: 13, color: '#6b5e50' }}>Full dashboard coming soon</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
              {cards.map(card => (
                <div key={card.label} style={{ background: '#f7f3ed', border: '1px solid #e8d5bc', borderRadius: 20, padding: 18 }}>
                  <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 10 }}>{card.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f3d2a' }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
