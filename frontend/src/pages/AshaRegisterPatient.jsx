import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api'

export default function AshaRegisterPatient() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('gramdoc_user') || '{}')

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    aadhaar: '',
    village: user.village || 'Kondapur',
    district: 'Warangal',
    state: 'Telangana',
    phc: '',
    conditions: [],
    allergies: '',
    bloodGroup: '',
    isPregnant: false,
    weeksPregnant: '',
    lmp: '',
    emergencyName: '',
    emergencyPhone: '',
    consent1: false,
    consent2: false
  })

  const [errors, setErrors] = useState({})

  const conditionsList = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'None']
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

  const toggleCondition = (c) => {
    if (c === 'None') {
      setForm({ ...form, conditions: ['None'] })
      return
    }
    const newConds = form.conditions.includes(c)
      ? form.conditions.filter(item => item !== c)
      : [...form.conditions.filter(item => item !== 'None'), c]
    setForm({ ...form, conditions: newConds })
  }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Full name is required'
    if (!form.phone || form.phone.length !== 10) e.phone = 'Valid 10-digit phone is required'
    if (!form.consent1 || !form.consent2) e.consent = 'Both consents are required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      const loading = toast.loading('Registering patient...')
      await api.registerPatientForAsha({
        name: form.name,
        phone: form.phone,
        village: form.village,
        age: form.age,
        gender: form.gender,
        conditions: form.conditions,
        bloodGroup: form.bloodGroup,
        isPregnant: form.isPregnant
      })
      toast.dismiss(loading)
      toast.success('✅ Patient registered successfully!')
      navigate('/app/asha-patients')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
  }

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #e8d5bc', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  }

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#6b5e50', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e8d5bc', fontSize: 15, color: '#0f3d2a', outline: 'none', background: '#fdf6ec' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 60, fontFamily: 'Mukta, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: '#fff', border: '1px solid #e8d5bc', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 28, color: '#0f3d2a', margin: 0 }}>➕ Register New Patient</h1>
          <p style={{ fontSize: 14, color: '#6b5e50', margin: 0 }}>Add a patient from your village to GramDoc</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Section 1 — Personal Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <h2 style={{ fontSize: 16, color: '#0f3d2a', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>👤</span> Personal Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input 
                placeholder="Ex: Ramesh Kumar" 
                style={{ ...inputStyle, border: errors.name ? '1px solid #A32D2D' : '1px solid #e8d5bc' }} 
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input 
                  type="number" 
                  placeholder="25" 
                  style={inputStyle} 
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: 'flex', gap: 4, background: '#fdf6ec', padding: 4, borderRadius: 10, border: '1px solid #e8d5bc' }}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g })}
                      style={{ 
                        flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: form.gender === g ? '#0f3d2a' : 'transparent',
                        color: form.gender === g ? '#fff' : '#0f3d2a',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Mobile Number *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ padding: '12px 14px', background: '#e8d5bc', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#0f3d2a' }}>+91</div>
                <input 
                  placeholder="9876543210" 
                  style={{ ...inputStyle, border: errors.phone ? '1px solid #A32D2D' : '1px solid #e8d5bc' }} 
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {errors.phone && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <div>
              <label style={labelStyle}>Aadhaar Number (Optional)</label>
              <input 
                placeholder="1234 5678 9012" 
                maxLength={12} 
                style={inputStyle} 
                value={form.aadhaar}
                onChange={e => setForm({ ...form, aadhaar: e.target.value })}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2 — Location */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
          <h2 style={{ fontSize: 16, color: '#0f3d2a', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📍</span> Location
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Village</label>
              <input value={form.village} style={{ ...inputStyle, background: '#f7f3ed', opacity: 0.7 }} disabled />
            </div>
            <div>
              <label style={labelStyle}>District</label>
              <input value={form.district} style={{ ...inputStyle, background: '#f7f3ed', opacity: 0.7 }} disabled />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input value={form.state} style={{ ...inputStyle, background: '#f7f3ed', opacity: 0.7 }} disabled />
            </div>
            <div>
              <label style={labelStyle}>Nearest PHC</label>
              <input 
                placeholder="Ex: Warangal Rural PHC" 
                style={inputStyle} 
                value={form.phc}
                onChange={e => setForm({ ...form, phc: e.target.value })}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3 — Health Information */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={cardStyle}>
          <h2 style={{ fontSize: 16, color: '#0f3d2a', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏥</span> Health Information
          </h2>
          
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Known Conditions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {conditionsList.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  style={{ 
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: form.conditions.includes(c) ? '#0f3d2a' : '#fdf6ec',
                    color: form.conditions.includes(c) ? '#fff' : '#0f3d2a',
                    border: '1px solid #e8d5bc', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Known Allergies</label>
              <input 
                placeholder="Ex: Peanuts, Dust" 
                style={inputStyle} 
                value={form.allergies}
                onChange={e => setForm({ ...form, allergies: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Blood Group</label>
              <select 
                style={inputStyle} 
                value={form.bloodGroup}
                onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: '#fdf6ec', borderRadius: 12, border: '1px solid #e8d5bc' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontWeight: 700, color: '#0f3d2a', fontSize: 14 }}>Is the patient pregnant?</div>
                 <div style={{ fontSize: 12, color: '#6b5e50' }}>Additional tracking for ANC visits</div>
               </div>
               <div 
                 onClick={() => setForm({ ...form, isPregnant: !form.isPregnant })}
                 style={{ 
                   width: 50, height: 26, borderRadius: 13, background: form.isPregnant ? '#0f3d2a' : '#ccc', 
                   position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
                 }}
               >
                 <div style={{ 
                   width: 20, height: 20, borderRadius: '50%', background: '#fff', 
                   position: 'absolute', top: 3, left: form.isPregnant ? 27 : 3, transition: 'left 0.3s' 
                 }} />
               </div>
             </div>
             
             {form.isPregnant && (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, borderTop: '1px solid #e8d5bc', paddingTop: 16 }}>
                 <div>
                   <label style={labelStyle}>Weeks Pregnant</label>
                   <input 
                     type="number" 
                     placeholder="Ex: 12" 
                     style={inputStyle} 
                     value={form.weeksPregnant}
                     onChange={e => setForm({ ...form, weeksPregnant: e.target.value })}
                   />
                 </div>
                 <div>
                   <label style={labelStyle}>Last Menstrual Date (LMP)</label>
                   <input 
                     type="date" 
                     style={inputStyle} 
                     value={form.lmp}
                     onChange={e => setForm({ ...form, lmp: e.target.value })}
                   />
                 </div>
               </div>
             )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Emergency Contact Name</label>
              <input 
                placeholder="Ex: Brother / Husband" 
                style={inputStyle} 
                value={form.emergencyName}
                onChange={e => setForm({ ...form, emergencyName: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Emergency Phone</label>
              <input 
                placeholder="9876543211" 
                style={inputStyle} 
                value={form.emergencyPhone}
                onChange={e => setForm({ ...form, emergencyPhone: e.target.value })}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 4 — Consent */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...cardStyle, background: '#EAF3DE', border: '1px solid #7bcaa4' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={form.consent1}
                onChange={e => setForm({ ...form, consent1: e.target.checked })}
                style={{ width: 18, height: 18, marginTop: 2 }} 
              />
              <span style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>Patient has given verbal consent to register on GramDoc</span>
            </label>
            <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={form.consent2}
                onChange={e => setForm({ ...form, consent2: e.target.checked })}
                style={{ width: 18, height: 18, marginTop: 2 }} 
              />
              <span style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>Patient agrees to share health data with their doctor</span>
            </label>
            {errors.consent && <div style={{ fontSize: 12, color: '#A32D2D' }}>{errors.consent}</div>}
          </div>
        </motion.div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02, background: '#082a1d' }}
          whileTap={{ scale: 0.98 }}
          style={{ 
            width: '100%', background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '18px', 
            fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(15,61,42,0.2)', transition: 'background 0.2s'
          }}
        >
          Register Patient →
        </motion.button>
      </form>
    </div>
  )
}
