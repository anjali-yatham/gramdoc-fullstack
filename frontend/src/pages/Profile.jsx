import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api, safeParse, dualSave } from '../utils/api'
import toast from 'react-hot-toast'

const spring = { type: 'spring', stiffness: 300, damping: 24 }



const ALL_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Urdu', 'Kannada', 'Marathi']
const SPECIALIZATIONS = ['General Physician', 'Pediatrician', 'Gynaecologist', 'Cardiologist', 'Dermatologist', 'General Medicine', 'ENT Specialist', 'Orthopedician']

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(api.getUser() || {})
  const [editMode, setEditMode] = useState(false)
  const [showToast, setShowToast] = useState(false)

  function getNextMonday() {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + diff)
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Availability Status
  const [isAvailable, setIsAvailable] = useState(() => {
    const s = safeParse(localStorage.getItem('gd_doctor_schedule'), null)
    if (s) return s.isAvailable !== false
    return true
  })

  // Quick Stats
  const history = safeParse(localStorage.getItem('gd_prescription_history'), [])
  const myRx = history.filter(rx => rx.doctorName === user?.name || rx.doctor?.name === user?.name)
  const totalConsultations = myRx.length
  const prescriptionsIssued = myRx.filter(rx => rx.medicines?.length > 0).length
  const uniqueVillages = [...new Set(myRx.map(r => r.village).filter(Boolean))].length

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    specialization: user?.specialization || '',
    regNumber: user?.regNumber || '',
    experience: user?.experience || '',
    email: user?.email || '',
    phone: user?.phone || '',
    languages: Array.isArray(user?.languages) ? user.languages : []
  })

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      specialization: user?.specialization || '',
      regNumber: user?.regNumber || '',
      experience: user?.experience || '',
      email: user?.email || '',
      phone: user?.phone || '',
      languages: Array.isArray(user?.languages) ? user.languages : []
    })

    const handleStorageChange = (e) => {
      if (e.key === 'gd_doctor_schedule') {
        const sch = safeParse(localStorage.getItem('gd_doctor_schedule'), null)
        if (sch && typeof sch.isAvailable === 'boolean') {
          setIsAvailable(sch.isAvailable)
        }
      }
      if (e.key === 'gramdoc_user') {
        setUser(safeParse(localStorage.getItem('gramdoc_user'), {}))
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])

  const toggleAvailability = async () => {
    const newStatus = !isAvailable
    setIsAvailable(newStatus)
    try {
      await api.toggleAvailability(newStatus)
    } catch (e) {
      toast.error('Could not sync availability')
    }
    const schedule = safeParse(localStorage.getItem('gd_doctor_schedule'), {})
    schedule.isAvailable = newStatus
    dualSave('gd_doctor_schedule', schedule)
  }

  const handleLanguageToggle = (lang) => {
    setFormData(prev => {
      const langs = prev.languages.includes(lang) 
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
      return { ...prev, languages: langs }
    })
  }

  const saveProfile = () => {
    api.verifyDoctor(formData.regNumber).then(res => {
        const updated = {
          ...user,
          name: formData.name,
          specialization: formData.specialization,
          regNumber: formData.regNumber,
          phone: formData.phone,
          email: formData.email,
          languages: formData.languages,
          experience: formData.experience,
          isVerified: res.isVerified
        }
        localStorage.setItem('gramdoc_user', JSON.stringify(updated))
        setUser(updated)
        setEditMode(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }).catch(() => {
        // Fallback if API fails
        const updated = { ...user, ...formData }
        localStorage.setItem('gramdoc_user', JSON.stringify(updated))
        setUser(updated)
        setEditMode(false)
    })
  }

  const fieldStyle = {
    background: editMode ? '#ffffff' : '#fdf6ec',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#0f3d2a',
    border: editMode ? '1.5px solid #7bcaa4' : '1.5px solid transparent',
    outline: 'none',
    width: '100%',
    fontFamily: "'Mukta', sans-serif",
    transition: 'all 0.2s ease',
    cursor: editMode ? 'text' : 'default'
  }

  const labelStyle = {
    fontSize: 11,
    color: '#6b5e50',
    marginBottom: 4,
    display: 'block'
  }

  const InputField = ({ label, field, type="text" }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input 
        type={type}
        value={formData[field]}
        onChange={e => setFormData({...formData, [field]: e.target.value})}
        readOnly={!editMode}
        style={fieldStyle}
      />
    </div>
  )

  // Working Hours Display
  const getWorkingHours = () => {
    const schedule = safeParse(localStorage.getItem('gd_doctor_schedule'), {})
    if (schedule.morning?.start && schedule.morning?.end) {
      return (
        <div style={{ fontSize: 13, color: '#0f3d2a' }}>
          <div>Morning: {schedule.morning.start} — {schedule.morning.end}</div>
          {schedule.afternoon?.start && <div>Afternoon: {schedule.afternoon.start} — {schedule.afternoon.end}</div>}
        </div>
      )
    }
    return <div style={{ fontSize: 13, color: '#6b5e50' }}>Not set</div>
  }

  const CountUp = ({ end, duration = 1.5 }) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
      let start = 0
      const target = parseFloat(end)
      const increment = target / (duration * 60)
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 1000 / 60)
      return () => clearInterval(timer)
    }, [end])
    return <>{count.toLocaleString('en-IN')}</>
  }

  const historyData = safeParse(localStorage.getItem('gd_prescription_history'), [])

  const todayStr = new Date().toDateString()
  const myRxData = historyData.filter(r => r.doctorName === user?.name || r.doctor?.name === user?.name)
  
  // Real dynamic stats
  const todayConsults = myRxData.filter(r => new Date(r.createdAt).toDateString() === todayStr).length
  
  // Calculate week earnings (last 7 days)
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weekConsults = myRxData.filter(r => new Date(r.createdAt) > oneWeekAgo).length
  
  // Total earnings for the month (current month)
  const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0,0,0,0)
  const monthConsults = myRxData.filter(r => new Date(r.createdAt) >= firstOfMonth).length
  
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, rate: null, nextPayout: null })

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await api.getEarnings()
        if (res && res.today !== undefined) {
          setEarnings({
            today: res.today,
            week: res.week,
            month: res.month,
            rate: res.rate ?? null,
            nextPayout: res.nextPayout ?? null
          })
        } else {
          const fallbackRate = user?.ratePerConsultation ?? null
          setEarnings({ 
            today: todayConsults * (fallbackRate || 0), 
            week: weekConsults * (fallbackRate || 0), 
            month: monthConsults * (fallbackRate || 0),
            rate: fallbackRate,
            nextPayout: null
          })
        }
      } catch(e) {
        const fallbackRate = user?.ratePerConsultation ?? null
        setEarnings({ 
          today: todayConsults * (fallbackRate || 0), 
          week: weekConsults * (fallbackRate || 0), 
          month: monthConsults * (fallbackRate || 0),
          rate: fallbackRate,
          nextPayout: null
        })
      }
    }
    loadEarnings()
  }, [myRxData.length])

  const todayEarnings = earnings.today
  const weekEarnings = earnings.week
  const monthEarnings = earnings.month

  return (
    <div style={{ background: '#f7f3ed', height: 'calc(100vh - 56px)', overflowY: 'auto', padding: 24, position: 'relative' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={spring}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 9999,
              background: '#0f3d2a', color: '#fff', padding: '12px 24px',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ color: '#7bcaa4' }}>✓</span> Profile updated successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 20 }}>
        
        {/* LEFT COLUMN */}
        <motion.div 
          initial={{ x: -30, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ ...spring, delay: 0 }}
          style={{ width: '35%', display: 'flex', flexDirection: 'column' }}
        >
          {/* Card 1 - Profile Hero */}
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc', textAlign: 'center' }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toast.success('Profile photo upload feature coming soon!')}
              style={{ 
                width: 120, height: 120, borderRadius: '50%', background: '#0f3d2a', 
                color: '#fff', fontSize: 44, fontWeight: 800, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(15,61,42,0.2)', border: '4px solid #fff',
                margin: '0 auto 16px'
              }}
            >
              {(user?.name || 'Dr').charAt(0).toUpperCase()}
            </motion.div>
            
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 22, color: '#0f3d2a' }}>{user?.name || 'Dr. Doctor'}</div>
            <div style={{ fontSize: 13, color: '#6b5e50', marginTop: 2 }}>{formData.specialization}</div>
            
            <motion.div 
              animate={{ boxShadow: user?.isVerified ? ['0 0 0px rgba(29,158,117,0)', '0 0 12px rgba(29,158,117,0.3)', '0 0 0px rgba(29,158,117,0)'] : [] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: user?.isVerified ? '#EAF3DE' : '#f0f0f0', color: user?.isVerified ? '#27500A' : '#6b5e50', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, width: 'fit-content', margin: '16px auto 8px' }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: user?.isVerified ? '#27500A' : '#6b5e50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{user?.isVerified ? '✓' : '!'}</div>
              {user?.isVerified ? 'MCI VERIFIED' : 'NOT VERIFIED'}
            </motion.div>
            <div style={{ fontSize: 11, color: '#6b5e50' }}>GramDoc Certified Doctor</div>
            
            <button 
              onClick={() => {
                if (editMode) {
                  // Cancel changes
                  setFormData({
                    name: user?.name || '',
                    specialization: user?.specialization || '',
                    regNumber: user?.regNumber || '',
                    experience: user?.experience || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    languages: user?.languages || []
                  })
                }
                setEditMode(!editMode)
              }}
              style={{ width: '100%', marginTop: 16, border: '1.5px solid #0f3d2a', background: 'transparent', color: '#0f3d2a', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e8f5ee'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {/* Card 2 - Availability */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12, border: '0.5px solid #e8d5bc' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', marginBottom: 12 }}>Availability</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? '#1d9e75' : '#6b5e50' }} />
                <div style={{ fontSize: 12, fontWeight: isAvailable ? 700 : 400, color: isAvailable ? '#7bcaa4' : '#6b5e50' }}>
                  {isAvailable ? 'Available for patients' : 'Currently busy'}
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div onClick={toggleAvailability} style={{ width: 44, height: 24, background: isAvailable ? '#1d9e75' : '#e0d6ca', borderRadius: 20, display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'background 0.2s' }}>
                <motion.div 
                  layout transition={spring}
                  style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', x: isAvailable ? 20 : 0 }} 
                />
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#6b5e50', fontStyle: 'italic', marginTop: 8 }}>Patients can see your availability on the doctor list</div>
          </div>

          {/* Card 3 - Quick Stats */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, marginTop: 12, border: '0.5px solid #e8d5bc' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 13, color: '#0f3d2a', marginBottom: 12 }}>This Month</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #e8d5bc' }}>
              <span style={{ fontSize: 12, color: '#6b5e50' }}>Consultations</span>
              <span style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 700 }}>{totalConsultations}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #e8d5bc' }}>
              <span style={{ fontSize: 12, color: '#6b5e50' }}>Prescriptions</span>
              <span style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 700 }}>{prescriptionsIssued}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 12, color: '#6b5e50' }}>Villages Covered</span>
              <span style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 700 }}>{uniqueVillages}</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ ...spring, delay: 0.1 }}
          style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* EARNINGS CARD */}
          <div style={{ background: 'linear-gradient(135deg, #0f3d2a, #1a5c38)', borderRadius: 20, padding: '28px 32px', color: '#fff', boxShadow: '0 12px 40px rgba(15,61,42,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 20 }}>💰 Earnings Overview</div>
              <div style={{ background: '#7bcaa4', color: '#0f3d2a', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 800 }}>
                {earnings.rate ? `₹${earnings.rate} PER CONSULTATION` : 'SET RATE IN SETTINGS'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'TODAY', amount: todayEarnings, count: todayConsults },
                { label: 'LAST 7 DAYS', amount: weekEarnings, count: weekConsults },
                { label: 'THIS MONTH', amount: monthEarnings, count: monthConsults }
              ].map((stat, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 24, fontWeight: 700 }}>₹<CountUp end={stat.amount} /></div>
                  <div style={{ fontSize: 11, color: '#7bcaa4', marginTop: 4 }}>{stat.count} consultations</div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: 20 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', opacity: 0.7 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12 }}>🏦 Next payout: {earnings.nextPayout || 'Not available'}</div>
                {user?.bankLast4 && <div style={{ fontSize: 11 }}>Bank account ending ••••{user.bankLast4}</div>}
              </div>
              <div style={{ fontSize: 10, fontStyle: 'italic' }}>{earnings.nextPayout ? 'Payout schedule based on provider settings' : 'Payout schedule not available'}</div>
            </div>
          </div>

          {/* SUBSCRIPTION PLAN SECTION */}
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ 
                fontFamily: "'Fraunces', serif", 
                fontStyle: 'italic', 
                fontSize: 18, 
                color: '#0f3d2a',
                margin: 0
              }}>
                📋 Subscription Plan
              </h3>
              <div style={{
                background: '#e8f5ee',
                color: '#0f3d2a',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700
              }}>
                BASIC PLAN — Active
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              {/* BASIC PLAN */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  border: '2px solid #0f3d2a',
                  borderRadius: 12,
                  padding: 20,
                  background: '#fff',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f3d2a', marginBottom: 8 }}>
                  Basic
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f3d2a', marginBottom: 12 }}>
                  ₹299<span style={{ fontSize: 13, fontWeight: 400 }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 16, lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 6 }}>✓ Up to 50 patients/month</div>
                  <div style={{ marginBottom: 6 }}>✓ Basic analytics</div>
                  <div style={{ marginBottom: 6 }}>✓ Digital prescriptions</div>
                  <div>✓ WhatsApp sharing</div>
                </div>
                <button
                  disabled
                  style={{
                    width: '100%',
                    background: '#e8d5bc',
                    color: '#6b5e50',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'not-allowed'
                  }}
                >
                  Current Plan
                </button>
              </motion.div>

              {/* PRO PLAN */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  border: '2px solid #e8d5bc',
                  borderRadius: 12,
                  padding: 20,
                  background: '#fff',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  background: '#854F0B',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  POPULAR
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f3d2a', marginBottom: 8 }}>
                  Pro
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f3d2a', marginBottom: 12 }}>
                  ₹599<span style={{ fontSize: 13, fontWeight: 400 }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 16, lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 6 }}>✓ Unlimited patients</div>
                  <div style={{ marginBottom: 6 }}>✓ Advanced analytics</div>
                  <div style={{ marginBottom: 6 }}>✓ Priority listing</div>
                  <div style={{ marginBottom: 6 }}>✓ Village health reports</div>
                  <div>✓ Earnings dashboard</div>
                </div>
                <button
                  onClick={() => toast('Redirecting to payment...')}
                  style={{
                    width: '100%',
                    background: '#0f3d2a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to Pro
                </button>
              </motion.div>

              {/* PREMIUM PLAN */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  border: '2px solid #e8d5bc',
                  borderRadius: 12,
                  padding: 20,
                  background: '#fff',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  background: '#7c3aed',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  BEST VALUE
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f3d2a', marginBottom: 8 }}>
                  Premium
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f3d2a', marginBottom: 12 }}>
                  ₹999<span style={{ fontSize: 13, fontWeight: 400 }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 16, lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 6 }}>✓ Everything in Pro</div>
                  <div style={{ marginBottom: 6 }}>✓ API access</div>
                  <div style={{ marginBottom: 6 }}>✓ White label option</div>
                  <div style={{ marginBottom: 6 }}>✓ Dedicated support</div>
                  <div style={{ marginBottom: 6 }}>✓ Custom branding</div>
                  <div>✓ Impact certificates</div>
                </div>
                <button
                  onClick={() => toast('Redirecting to payment...')}
                  style={{
                    width: '100%',
                    background: '#0f3d2a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to Premium
                </button>
              </motion.div>
            </div>

            <div style={{ fontSize: 11, color: '#6b5e50', textAlign: 'center', fontStyle: 'italic' }}>
              * Plans renew monthly. Cancel anytime. GST included in pricing.
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '0.5px solid #e8d5bc' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 20, color: '#0f3d2a' }}>Professional Details</div>
              <AnimatePresence>
                {editMode && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={saveProfile}
                    style={{ background: '#0f3d2a', color: '#ffffff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Save Changes
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div style={{ height: '0.5px', background: '#e8d5bc', marginBottom: 24 }} />

            {/* SECTION A */}
            <div style={{ fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Personal Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Full Name" field="name" />
              
              <div>
                <label style={labelStyle}>Specialization</label>
                {editMode ? (
                  <select 
                    value={formData.specialization} 
                    onChange={e => setFormData({...formData, specialization: e.target.value})}
                    style={{...fieldStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%230f3d2a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px top 50%', backgroundSize: '10px auto'}}
                  >
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <div style={fieldStyle}>{formData.specialization}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Medical Registration No.</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={editMode ? formData.regNumber : (formData.regNumber || 'Not provided')}
                    onChange={e => setFormData({...formData, regNumber: e.target.value})}
                    readOnly={!editMode}
                    style={{...fieldStyle, paddingRight: !editMode ? 36 : 14}}
                  />
                  {!editMode && (
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔒</span>
                  )}
                </div>
              </div>

              <InputField label="Years of Experience" field="experience" />
            </div>

            {/* SECTION B */}
            <div style={{ height: '0.5px', background: '#e8d5bc', margin: '20px 0 16px' }} />
            <div style={{ fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Contact Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.7 }}>✉️</span>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} readOnly={!editMode} style={{...fieldStyle, paddingLeft: 36}} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.7 }}>📞</span>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} readOnly={!editMode} style={{...fieldStyle, paddingLeft: 36}} />
                </div>
              </div>
            </div>

            {/* SECTION C */}
            <div style={{ height: '0.5px', background: '#e8d5bc', margin: '20px 0 16px' }} />
            <div style={{ fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Languages Known</div>
            
            {editMode ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {ALL_LANGUAGES.map(lang => {
                  const checked = formData.languages.includes(lang)
                  return (
                    <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#0f3d2a' }}>
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={() => handleLanguageToggle(lang)}
                        style={{ accentColor: '#7bcaa4', width: 16, height: 16, cursor: 'pointer' }}
                      />
                      {lang}
                    </label>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {formData.languages.map(lang => (
                  <span key={lang} style={{ background: '#EAF3DE', color: '#27500A', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {/* SECTION D */}
            <div style={{ height: '0.5px', background: '#e8d5bc', margin: '20px 0 16px' }} />
            <div style={{ fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Working Hours</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {getWorkingHours()}
              <div onClick={() => navigate('/app/schedule')} style={{ fontSize: 12, color: '#1d9e75', fontWeight: 600, cursor: 'pointer' }}>
                Edit in Schedule tab →
              </div>
            </div>

            {/* SECTION E */}
            <div style={{ height: '0.5px', background: '#e8d5bc', margin: '20px 0 16px' }} />
            <div style={{ fontSize: 10, color: '#6b5e50', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Verification Status</div>
            <div style={{ background: user?.isVerified ? '#EAF3DE' : '#fff0f0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: user?.isVerified ? 'none' : '1px solid #ffcaca' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: user?.isVerified ? '#1d9e75' : '#c4653a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {user?.isVerified ? '✓' : '!'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 16, color: user?.isVerified ? '#27500A' : '#c4653a' }}>{user?.isVerified ? 'Verified Doctor' : 'Verification Pending'}</div>
                <div style={{ fontSize: 11, color: user?.isVerified ? '#3B6D11' : '#c4653a', marginTop: 2 }}>{user?.isVerified ? 'Your medical credentials have been verified by GramDoc admin' : 'Submit your registration number in profile edit to verify'}</div>
              </div>
              <div style={{ background: user?.isVerified ? '#27500A' : '#c4653a', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {user?.isVerified ? 'ACTIVE' : 'PENDING'}
              </div>
            </div>

            {/* CONSULTATION HISTORY */}
            <div style={{ height: '0.5px', background: '#e8d5bc', margin: '30px 0 20px' }} />
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', margin: '0 0 4px' }}>Consultation History</h2>
              <div style={{ fontSize: 11, color: '#6b5e50' }}>All patients you have consulted</div>
            </div>

            {(() => {
              const prescriptions = safeParse(localStorage.getItem('gd_prescription_history'), [])
              const myHistory = prescriptions.filter(rx => rx.doctorName === user?.name || rx.doctor?.name === user?.name);
              
              if (myHistory.length === 0) {
                return (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic', marginBottom: 4 }}>No consultation history yet</div>
                    <div style={{ fontSize: 11, color: '#6b5e50', fontStyle: 'italic' }}>Complete your first consultation to see history here</div>
                  </div>
                )
              }

              const groupedByDate = myHistory.reduce((acc, rx) => {
                const date = rx.date || new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                if (!acc[date]) acc[date] = [];
                acc[date].push(rx);
                return acc;
              }, {});

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(groupedByDate).map(([date, patients]) => (
                    <div key={date}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', marginBottom: 12 }}>{date}</div>
                      <div style={{ borderLeft: '2px solid #7bcaa4', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {patients.map((rx, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f3d2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                {(rx.patientName || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{rx.patientName || 'Unknown Patient'}</div>
                                <div style={{ fontSize: 11, color: '#6b5e50' }}>{rx.diagnosis || 'General Consultation'}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 10, color: '#6b5e50', marginBottom: 4 }}>{rx.time || ''}</div>
                              <span 
                                onClick={() => {
                                  localStorage.setItem('gd_view_prescription', JSON.stringify({ _id: rx._id, patientName: rx.patientName, diagnosis: rx.diagnosis }));
                                  navigate('/app/prescriptions');
                                }}
                                style={{ fontSize: 11, color: '#7bcaa4', fontWeight: 600, cursor: 'pointer' }}
                              >
                                View Rx →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

          </div>
        </motion.div>
      </div>
    </div>
  )
}
