import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, safeParse } from '../utils/api'
import toast from 'react-hot-toast'

export default function DoctorConfirm() {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    const parsedDoctor = safeParse(localStorage.getItem('gd_doctor'), null)
    if (parsedDoctor && typeof parsedDoctor === 'object') {
      setDoctor(parsedDoctor)
    } else {
      toast.error('Doctor details not found. Please select a doctor again.')
      navigate('/app/doctors')
    }
  }, [navigate])

  const handleConfirm = async () => {
    if (!doctor?._id) {
      toast.error('Unable to book this doctor right now.')
      return
    }

    try {
      const res = await api.startConsultation(doctor._id)
      localStorage.setItem('consultationId', res._id || res.consultationId)
      localStorage.setItem('gd_consultation_id', res._id || res.consultationId)

      // Save as a booked appointment for the dashboard
      localStorage.setItem('gd_booked_appointment', JSON.stringify({
        doctorName: doctor.name,
        date: new Date().toISOString(),
        time: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        id: res._id || 'mock_id'
      }))
      navigate('/app/consultation/call')
    } catch (err) {
      toast.error(err?.message || 'Booking failed. Please try again.')
    }
  }

  if (!doctor) return null

  return (
    <div style={{ background: '#0f3d2a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: 400, width: '100%' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#7bcaa4', color: '#0f3d2a', fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          {doctor.name.split(' ').filter((_,i)=>i>0).map(n=>n[0]).join('').slice(0,2) || 'DR'}
        </div>
        
        <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 28, margin: '0 0 8px 0' }}>{doctor.name}</h1>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 16 }}>{doctor.specialization}</div>
        
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {(doctor.languages || ['English', 'Hindi', 'Telugu']).map(l => (
            <span key={l} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, fontSize: 13 }}>{l}</span>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Consultation Fee</span>
            <span style={{ fontWeight: 600 }}>{doctor?.fee ? `₹${doctor.fee}` : 'Fee unavailable'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Estimated Wait</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#7bcaa4' }} 
              />
              <span style={{ color: '#7bcaa4', fontWeight: 700 }}>{doctor?.estimatedWait || 'Wait unavailable'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            style={{ width: '100%', background: '#7bcaa4', color: '#0f3d2a', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Confirm Booking
          </motion.button>
          
          <motion.button 
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
            onClick={() => navigate(-1)}
            style={{ width: '100%', background: 'transparent', color: '#fff', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
          >
            Go Back
          </motion.button>
        </div>
      </div>
    </div>
  )
}
