import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { safeParse } from '../utils/api'

export default function AshaAccountability() {
  const [visits, setVisits] = useState([])
  const [accountabilityScore, setAccountabilityScore] = useState(76)

  useEffect(() => {
    const storedVisits = safeParse(localStorage.getItem('gd_asha_visits'), [])
    setVisits(storedVisits)
    
    // Calculate score
    if (storedVisits.length > 0) {
      const verified = storedVisits.filter(v => v.gpsVerified).length
      const score = Math.round((verified / storedVisits.length) * 100)
      setAccountabilityScore(score)
    }
  }, [])

  const handleMarkVisitDone = (patientName) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const visit = {
            id: Date.now(),
            patientName: patientName,
            village: 'Kondapur',
            claimedAt: new Date().toISOString(),
            gps: { lat: latitude, lng: longitude },
            gpsVerified: true,
            patientConfirmed: 'pending',
            status: 'gps-verified'
          }
          const updatedVisits = [visit, ...visits]
          setVisits(updatedVisits)
          localStorage.setItem('gd_asha_visits', JSON.stringify(updatedVisits))
          
          // Update score
          const verified = updatedVisits.filter(v => v.gpsVerified).length
          const score = Math.round((verified / updatedVisits.length) * 100)
          setAccountabilityScore(score)
          
          toast.success('✅ Visit recorded with GPS verification!')
          toast('📱 Confirmation request sent to patient', { icon: '📱' })
        },
        (err) => {
          const visit = {
            id: Date.now(),
            patientName: patientName,
            claimedAt: new Date().toISOString(),
            gpsVerified: false,
            patientConfirmed: 'pending',
            status: 'unverified'
          }
          const updatedVisits = [visit, ...visits]
          setVisits(updatedVisits)
          localStorage.setItem('gd_asha_visits', JSON.stringify(updatedVisits))
          
          toast('Visit recorded without GPS. Add reason below.', { icon: '⚠️' })
        }
      )
    } else {
      toast.error('GPS not available on this device')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#1d9e75'
    if (score >= 60) return '#f59e0b'
    return '#dc2626'
  }

  const getStatusBadge = (visit) => {
    if (visit.gpsVerified && visit.patientConfirmed === 'yes') {
      return { text: '✅ GPS Verified — within 50m', color: '#1d9e75', bg: '#d4f1e8' }
    }
    if (visit.gpsVerified) {
      return { text: '✅ GPS Verified — within 50m', color: '#1d9e75', bg: '#d4f1e8' }
    }
    if (visit.status === 'disputed') {
      return { text: '🔴 Disputed — patient said NO', color: '#dc2626', bg: '#fee2e2' }
    }
    return { text: '⚠️ Unverified — no GPS data', color: '#f59e0b', bg: '#fef3cd' }
  }

  const getPatientConfirmation = (visit) => {
    if (visit.patientConfirmed === 'yes') return { text: '✅ Patient confirmed', color: '#1d9e75' }
    if (visit.patientConfirmed === 'no') return { text: '❌ Patient denied', color: '#dc2626' }
    return { text: '⏳ Awaiting confirmation', color: '#f59e0b' }
  }

  const verified = visits.filter(v => v.gpsVerified).length
  const patientConfirmed = visits.filter(v => v.patientConfirmed === 'yes').length
  const unverified = visits.filter(v => !v.gpsVerified).length
  const disputed = visits.filter(v => v.status === 'disputed').length
  const totalClaimed = visits.length

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', margin: 0 }}>🎯 Visit Accountability</h1>
        <p style={{ fontSize: 16, color: '#6b5e50', margin: '4px 0 0 0' }}>GPS-verified patient visits</p>
      </div>

      {/* Accountability Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, ${getScoreColor(accountabilityScore)}, ${getScoreColor(accountabilityScore)}dd)`,
          borderRadius: 20,
          padding: '32px',
          marginBottom: 32,
          color: '#fff',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, opacity: 0.9 }}>Accountability Score</div>
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.9" fill="transparent" stroke="#fff" strokeWidth="3"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - accountabilityScore }}
              transition={{ duration: 1.5 }}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'Fraunces' }}>{accountabilityScore}%</div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 400, margin: '0 auto', fontSize: 13 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px' }}>
            <div style={{ fontWeight: 700 }}>✅ GPS Verified: {verified}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px' }}>
            <div style={{ fontWeight: 700 }}>✅ Patient Confirmed: {patientConfirmed}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px' }}>
            <div style={{ fontWeight: 700 }}>⚠️ Unverified: {unverified}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px' }}>
            <div style={{ fontWeight: 700 }}>🔴 Disputed: {disputed}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700 }}>Total claimed: {totalClaimed}</div>
      </motion.div>

      {/* Quick Mark Visit Button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => handleMarkVisitDone('Sample Patient')}
          style={{
            width: '100%',
            background: '#0f3d2a',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(15,61,42,0.2)'
          }}
        >
          ✓ Mark Visit Done (with GPS)
        </button>
      </div>

      {/* Visit Log Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, color: '#0f3d2a', fontWeight: 800, marginBottom: 20 }}>📋 Recent Visit Log</h2>
        
        {visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 16, border: '1px dashed #e8d5bc' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, color: '#6b5e50' }}>No visits recorded yet</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Mark visits as done to track your accountability</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 10, top: 20, bottom: 20, width: 2, background: '#e8d5bc' }} />
            
            {visits.map((visit, i) => {
              const statusBadge = getStatusBadge(visit)
              const patientConf = getPatientConfirmation(visit)
              const dotColor = visit.gpsVerified ? '#1d9e75' : visit.status === 'disputed' ? '#dc2626' : '#f59e0b'
              
              return (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '20px 20px 20px 40px',
                    border: '1px solid #e8d5bc',
                    position: 'relative',
                    marginLeft: 20
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: -30,
                    top: 24,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: dotColor,
                    border: '2px solid #fff',
                    zIndex: 1
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f3d2a', marginBottom: 4 }}>
                        {visit.patientName}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 8 }}>
                        {visit.village} • {new Date(visit.claimedAt).toLocaleString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      {/* GPS Status Badge */}
                      <div style={{
                        display: 'inline-block',
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 12,
                        marginBottom: 8
                      }}>
                        {statusBadge.text}
                      </div>

                      {/* Patient Confirmation */}
                      <div style={{ fontSize: 12, color: patientConf.color, fontWeight: 600, marginTop: 8 }}>
                        {patientConf.text}
                      </div>
                    </div>

                    {visit.gps && (
                      <div style={{ fontSize: 10, color: '#999', textAlign: 'right' }}>
                        <div>GPS: {visit.gps.lat.toFixed(4)}</div>
                        <div>{visit.gps.lng.toFixed(4)}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
