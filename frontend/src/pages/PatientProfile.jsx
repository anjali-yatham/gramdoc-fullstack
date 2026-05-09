import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, safeParse } from '../utils/api'
import toast from 'react-hot-toast'
import { LANGS } from '../utils/translations'

export default function PatientProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = api.getUser()
  const routedPatient = location.state?.patient || null
  const [editMode, setEditMode] = useState(false)
  const currentUser = api.getUser() || {}
  const isAshaViewingPatient = currentUser.role === 'asha' && !!routedPatient
  const profileSubject = isAshaViewingPatient ? routedPatient : user
  
  const [health, setHealth] = useState({
    fullName: profileSubject?.name || '',
    bloodGroup: '',
    age: '',
    gender: '',
    village: '',
    district: '',
    state: '',
    phone: profileSubject?.phone || ''
  })

  const [history, setHistory] = useState([])
  const [family, setFamily] = useState([])
  const [showAddFamily, setShowAddFamily] = useState(false)
  const [newFam, setNewFam] = useState({ name: '', relation: '', age: '', phone: '' })
  const [asha, setAsha] = useState(null)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
  
  const [medicalInfo, setMedicalInfo] = useState({
    allergies: '',
    chronicConditions: [],
    emergencyName: '',
    emergencyPhone: ''
  })
  const [insuranceInfo, setInsuranceInfo] = useState({
    aarogya: false,
    pmjay: false,
    aadhaar: '',
    coverageStatus: ''
  })
  const [patientProfileData, setPatientProfileData] = useState({})

  const langKey = currentUser.role === 'asha' ? 'en' : (localStorage.getItem('gramdoc_lang') || 'en')
  const t = LANGS[langKey]?.ui || LANGS.en.ui
  const TX = {
    incomplete: { en: 'Your profile is incomplete', hi: 'आपकी प्रोफ़ाइल अधूरी है', te: 'మీ ప్రొఫైల్ పూర్తి కాలేదు' },
    incompleteSub: { en: 'Please add your blood group, age, and village to help doctors treat you better.', hi: 'डॉक्टरों को बेहतर मदद के लिए कृपया ब्लड ग्रुप, उम्र और गांव जोड़ें।', te: 'డాక్టర్లు మెరుగ్గా సహాయం చేయడానికి మీ రక్త గుంపు, వయస్సు, గ్రామం నమోదు చేయండి.' },
    completeNow: { en: 'Complete Now', hi: 'अभी पूरा करें', te: 'ఇప్పుడే పూర్తి చేయండి' },
    saved: { en: 'Profile updated successfully!', hi: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई!', te: 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!' },
    patient: { en: 'PATIENT', hi: 'मरीज', te: 'రోగి' },
    healthInfo: { en: 'My Health Info', hi: 'मेरी स्वास्थ्य जानकारी', te: 'నా ఆరోగ్య సమాచారం' },
    edit: { en: 'Edit', hi: 'संपादित करें', te: 'సవరించు' },
    save: { en: 'Save', hi: 'सेव करें', te: 'సేవ్ చేయండి' },
    bloodGroup: { en: 'Blood Group', hi: 'ब्लड ग्रुप', te: 'రక్త గుంపు' },
    age: { en: 'Age', hi: 'उम्र', te: 'వయస్సు' },
    gender: { en: 'Gender', hi: 'लिंग', te: 'లింగం' },
    village: { en: 'Village', hi: 'गांव', te: 'గ్రామం' },
    phone: { en: 'Phone', hi: 'फ़ोन', te: 'ఫోన్' },
    notSet: { en: 'Not set', hi: 'सेट नहीं', te: 'సెట్ కాలేదు' },
    language: { en: 'My Language', hi: 'मेरी भाषा', te: 'నా భాష' },
    change: { en: 'Change', hi: 'बदलें', te: 'మార్చండి' },
    asha: { en: 'Connected ASHA Worker', hi: 'जुड़ी हुई आशा कार्यकर्ता', te: 'కనెక్ట్ అయిన ఆశా వర్కర్' },
    contactAsha: { en: 'Contact ASHA on WhatsApp', hi: 'WhatsApp पर आशा से संपर्क करें', te: 'WhatsApp లో ఆశాను సంప్రదించండి' },
    noAsha: { en: 'No ASHA worker linked', hi: 'कोई आशा कार्यकर्ता लिंक नहीं है', te: 'ఆశా వర్కర్ లింక్ కాలేదు' },
    consultations: { en: 'My Consultations', hi: 'मेरी परामर्श सूची', te: 'నా సంప్రదింపులు' },
    viewRx: { en: 'View Prescription →', hi: 'प्रिस्क्रिप्शन देखें →', te: 'ప్రిస్క్రిప్షన్ చూడండి →' },
    noConsult: { en: 'No consultations yet', hi: 'अभी तक कोई परामर्श नहीं', te: 'ఇంకా సంప్రదింపులు లేవు' },
    talkDoctor: { en: 'Talk to a doctor →', hi: 'डॉक्टर से बात करें →', te: 'డాక్టర్‌తో మాట్లాడండి →' },
    family: { en: 'My Family', hi: 'मेरा परिवार', te: 'నా కుటుంబం' },
    addMember: { en: '+ Add Member', hi: '+ सदस्य जोड़ें', te: '+ సభ్యుడిని జోడించండి' },
    name: { en: 'Name', hi: 'नाम', te: 'పేరు' },
    relation: { en: 'Relation (e.g. Mother)', hi: 'रिश्ता (जैसे: माता)', te: 'సంబంధం (ఉదా: తల్లి)' },
    cancel: { en: 'Cancel', hi: 'रद्द करें', te: 'రద్దు చేయి' },
    yrs: { en: 'yrs', hi: 'वर्ष', te: 'ఏళ్లు' }
  }
  const langFlags = { 'en': '🇮🇳 English', 'hi': '🇮🇳 हिंदी', 'te': '🇮🇳 తెలుగు' }

  useEffect(() => {
    if (isAshaViewingPatient) {
      setHealth({
        fullName: routedPatient?.name || '',
        bloodGroup: routedPatient?.bloodGroup || '',
        age: routedPatient?.age || '',
        gender: routedPatient?.gender || '',
        village: routedPatient?.village || '',
        district: routedPatient?.district || '',
        state: routedPatient?.state || '',
        phone: routedPatient?.phone || ''
      })
      const hist = safeParse(localStorage.getItem('gd_prescription_history'), [])
      const targetName = (routedPatient?.name || '').toLowerCase()
      setHistory(hist.filter(rx => {
        const patientName = (rx.patientName || rx.patient?.name || '').toLowerCase()
        return patientName === targetName
      }))
      setFamily([])
      setAsha({ name: currentUser.name || 'ASHA Worker', village: currentUser.village || '', phone: currentUser.phone || '' })
      return
    }

    const storedProfile = safeParse(localStorage.getItem('gd_patient_profile'), null)
    const storedHealth = safeParse(localStorage.getItem('gd_patient_health'), null)
    if (storedProfile?.personal) {
      setHealth(prev => ({ ...prev, ...storedProfile.personal }))
      setPatientProfileData(storedProfile)
    } else if (storedHealth) {
      setHealth(prev => ({ ...prev, ...storedHealth }))
    } else {
      setIsProfileIncomplete(true)
    }

    const hist = safeParse(localStorage.getItem('gd_prescription_history'), [])
    // Aggressive filter for Dr. Sri mock data
    setHistory(hist.filter(rx => {
      const docName = (rx.doctorName || rx.doctor?.name || '').toLowerCase()
      return !docName.includes('sri')
    }))

    const fam = safeParse(localStorage.getItem('gd_family_members'), [])
    setFamily(fam)

    const storedAsha = safeParse(localStorage.getItem('gd_asha'), null)
    if (storedAsha) setAsha(storedAsha)

    // Load medical info
    const storedMedical = safeParse(localStorage.getItem('gd_patient_medical_info'), {
      allergies: '',
      chronicConditions: [],
      emergencyName: '',
      emergencyPhone: ''
    })
    setMedicalInfo(storedMedical)

    // Load insurance info
    const storedInsurance = safeParse(localStorage.getItem('gd_patient_insurance'), {
      aarogya: false,
      pmjay: false,
      aadhaar: '',
      coverageStatus: ''
    })
    setInsuranceInfo(storedInsurance)

    if (storedProfile?.medical) setMedicalInfo(storedProfile.medical)
    if (storedProfile?.insurance) setInsuranceInfo(storedProfile.insurance)
  }, [isAshaViewingPatient, routedPatient, currentUser.name, currentUser.village, currentUser.phone])

  useEffect(() => {
    // Check if profile is missing key details
    const incomplete = !health.bloodGroup || !health.age || !health.village || !health.gender
    setIsProfileIncomplete(incomplete)
  }, [health])

  const handleSaveHealth = () => {
    if (isAshaViewingPatient) {
      toast('Patient profile is read-only for ASHA view', { icon: 'ℹ️' })
      setEditMode(false)
      return
    }
    const profilePayload = {
      personal: {
        fullName: health.fullName || profileSubject?.name || user?.name || '',
        age: health.age,
        gender: health.gender,
        bloodGroup: health.bloodGroup,
        village: health.village,
        district: health.district,
        state: health.state,
        phone: health.phone
      },
      medical: medicalInfo,
      insurance: insuranceInfo,
      updatedAt: new Date().toISOString()
    }
    setPatientProfileData(profilePayload)
    localStorage.setItem('gd_patient_profile', JSON.stringify(profilePayload))
    localStorage.setItem('gd_patient_health', JSON.stringify(health))
    if (health.fullName && !isAshaViewingPatient) {
      const current = safeParse(localStorage.getItem('gramdoc_user'), {})
      localStorage.setItem('gramdoc_user', JSON.stringify({ ...current, name: health.fullName }))
    }
    setEditMode(false)
    toast.success('Profile updated!')
  }

  const handleAddFamily = () => {
    if (!newFam.name) return
    const updated = [...family, newFam]
    setFamily(updated)
    localStorage.setItem('gd_family_members', JSON.stringify(updated))
    setNewFam({ name: '', relation: '', age: '', phone: '' })
    setShowAddFamily(false)
  }

  const handleViewRx = (rx) => {
    localStorage.setItem('gd_view_prescription', JSON.stringify({ patientName: rx.patientName, diagnosis: rx.diagnosis, patientAge: health.age }))
    navigate('/app/prescriptions')
  }

  const nameInitial = (profileSubject?.name || 'Patient')[0].toUpperCase()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      {isProfileIncomplete && !editMode && (
        <div style={{ background: '#fdf6ec', border: '1px solid #c4653a', borderRadius: 12, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: '#c4653a' }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{TX.incomplete[langKey] || TX.incomplete.en}</div>
            <div style={{ fontSize: 12 }}>{TX.incompleteSub[langKey] || TX.incompleteSub.en}</div>
          </div>
          <button onClick={() => setEditMode(true)} style={{ background: '#c4653a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{TX.completeNow[langKey] || TX.completeNow.en}</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0f3d2a', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {nameInitial}
            </div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 24, color: '#0f3d2a', fontWeight: 600 }}>{profileSubject?.name || 'Patient Name'}</div>
            <div style={{ fontSize: 13, color: '#6b5e50', marginTop: 4 }}>{health.village || 'Location not set'}</div>
            <div style={{ display: 'inline-block', background: '#7bcaa4', color: '#0f3d2a', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, marginTop: 12 }}>{TX.patient[langKey] || TX.patient.en}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 15, color: '#0f3d2a', fontWeight: 600 }}>Personal Details</div>
              {!editMode && !isAshaViewingPatient ? (
                <button onClick={() => setEditMode(true)} style={{ background: 'transparent', border: '1px solid #0f3d2a', color: '#0f3d2a', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>✏️ {TX.edit[langKey] || TX.edit.en}</button>
              ) : editMode ? (
                <button onClick={handleSaveHealth} style={{ background: '#0f3d2a', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{TX.save[langKey] || TX.save.en}</button>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>Full Name</span>
                {editMode ? (
                  <input value={health.fullName} onChange={e => setHealth({ ...health, fullName: e.target.value })} style={{ width: 120, padding: 4, fontSize: 13 }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{health.fullName || profileSubject?.name || user?.name || 'Patient'}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>{TX.bloodGroup[langKey] || TX.bloodGroup.en}</span>
                {editMode ? (
                  <select value={health.bloodGroup} onChange={e => setHealth({...health, bloodGroup: e.target.value})} style={{ width: 80, padding: 4, fontSize: 13 }}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: health.bloodGroup ? '#0f3d2a' : '#ccc' }}>{health.bloodGroup || (TX.notSet[langKey] || TX.notSet.en)}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>{TX.age[langKey] || TX.age.en}</span>
                {editMode ? <input type="number" value={health.age} onChange={e => setHealth({...health, age: e.target.value})} style={{ width: 60, padding: 4, fontSize: 13 }} /> : <span style={{ fontSize: 13, fontWeight: 600, color: health.age ? '#0f3d2a' : '#ccc' }}>{health.age || (TX.notSet[langKey] || TX.notSet.en)}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>{TX.gender[langKey] || TX.gender.en}</span>
                {editMode ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        onClick={() => setHealth({ ...health, gender: g })}
                        style={{
                          borderRadius: 999,
                          border: health.gender === g ? 'none' : '1px solid #e8d5bc',
                          background: health.gender === g ? '#0f3d2a' : '#fff',
                          color: health.gender === g ? '#fff' : '#6b5e50',
                          fontSize: 11,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: health.gender ? '#0f3d2a' : '#ccc' }}>{health.gender || (TX.notSet[langKey] || TX.notSet.en)}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>{TX.village[langKey] || TX.village.en}</span>
                {editMode ? <input value={health.village} onChange={e => setHealth({...health, village: e.target.value})} style={{ width: 100, padding: 4, fontSize: 13 }} /> : <span style={{ fontSize: 13, fontWeight: 600, color: health.village ? '#0f3d2a' : '#ccc' }}>{health.village || (TX.notSet[langKey] || TX.notSet.en)}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>District</span>
                {editMode ? <input value={health.district} onChange={e => setHealth({...health, district: e.target.value})} style={{ width: 100, padding: 4, fontSize: 13 }} /> : <span style={{ fontSize: 13, fontWeight: 600, color: health.district ? '#0f3d2a' : '#ccc' }}>{health.district || 'Not set'}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>State</span>
                {editMode ? <input value={health.state} onChange={e => setHealth({...health, state: e.target.value})} style={{ width: 100, padding: 4, fontSize: 13 }} /> : <span style={{ fontSize: 13, fontWeight: 600, color: health.state ? '#0f3d2a' : '#ccc' }}>{health.state || 'Not set'}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6b5e50' }}>{TX.phone[langKey] || TX.phone.en}</span>
                {editMode ? (
                  <input value={health.phone} onChange={e => setHealth({...health, phone: e.target.value})} style={{ width: 100, padding: 4, fontSize: 13 }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{health.phone || (TX.notSet[langKey] || TX.notSet.en)}</span>
                )}
              </div>
            </div>
          </div>

          {!isAshaViewingPatient && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
             <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 13, color: '#0f3d2a', fontWeight: 600, marginBottom: 12 }}>{TX.language[langKey] || TX.language.en}</div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: 14 }}>{langFlags[langKey] || '🇮🇳 English'}</span>
               <button onClick={() => navigate('/language')} style={{ background: '#fdf6ec', border: '1px solid #e8d5bc', color: '#0f3d2a', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{TX.change[langKey] || TX.change.en}</button>
             </div>
          </div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', fontWeight: 600, marginBottom: 12 }}>{TX.asha[langKey] || TX.asha.en}</div>
            {asha ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>{asha.name}</div>
                <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 12 }}>{asha.village}</div>
                <button
                  onClick={() => {
                    if (!asha?.phone) {
                      toast.error('ASHA phone number not available')
                      return
                    }
                    window.open(`https://wa.me/${String(asha.phone).replace(/[^\d]/g, '')}`, '_blank')
                  }}
                  style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {TX.contactAsha[langKey] || TX.contactAsha.en}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#6b5e50', fontStyle: 'italic' }}>{TX.noAsha[langKey] || TX.noAsha.en}</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
             <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', fontWeight: 600, marginBottom: 20 }}>{TX.consultations[langKey] || TX.consultations.en}</div>
             {history.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                 <div style={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, background: '#e8d5bc' }} />
                 {history.map((rx, i) => (
                   <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                     <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#7bcaa4', border: '2px solid #fff', zIndex: 1, marginTop: 4 }} />
                     <div style={{ flex: 1, background: '#f8fafc', padding: 16, borderRadius: 12, border: '0.5px solid #e8d5bc' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                         <span style={{ fontSize: 14, fontWeight: 700, color: '#0f3d2a' }}>{rx.doctorName || rx.doctor?.name || 'Doctor'}</span>
                         <span style={{ fontSize: 11, color: '#6b5e50' }}>{rx.date || 'Recent'}</span>
                       </div>
                       <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic', marginBottom: 12 }}>{rx.diagnosis}</div>
                       <span onClick={() => handleViewRx(rx)} style={{ fontSize: 12, color: '#7bcaa4', fontWeight: 700, cursor: 'pointer' }}>{TX.viewRx[langKey] || TX.viewRx.en}</span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ textAlign: 'center', padding: 20 }}>
                 <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic', marginBottom: 12 }}>{TX.noConsult[langKey] || TX.noConsult.en}</div>
                 <button onClick={() => navigate('/app/doctors')} style={{ background: 'transparent', border: '1px solid #7bcaa4', color: '#0f3d2a', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{TX.talkDoctor[langKey] || TX.talkDoctor.en}</button>
               </div>
             )}
          </div>

          {!isAshaViewingPatient && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', fontWeight: 600 }}>{TX.family[langKey] || TX.family.en}</div>
               {!showAddFamily && family.length < 4 && (
                 <button onClick={() => setShowAddFamily(true)} style={{ background: 'transparent', border: '1px solid #0f3d2a', color: '#0f3d2a', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{TX.addMember[langKey] || TX.addMember.en}</button>
               )}
             </div>

             {showAddFamily && (
               <div style={{ background: '#fdf6ec', padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                 <input placeholder={TX.name[langKey] || TX.name.en} value={newFam.name} onChange={e=>setNewFam({...newFam, name: e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #e8d5bc', fontSize: 12 }} />
                 <input placeholder={TX.relation[langKey] || TX.relation.en} value={newFam.relation} onChange={e=>setNewFam({...newFam, relation: e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #e8d5bc', fontSize: 12 }} />
                 <input type="number" placeholder={TX.age[langKey] || TX.age.en} value={newFam.age} onChange={e=>setNewFam({...newFam, age: e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #e8d5bc', fontSize: 12 }} />
                 <div style={{ display: 'flex', gap: 8 }}>
                   <button onClick={handleAddFamily} style={{ flex: 1, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 6, padding: 8, fontSize: 12, cursor: 'pointer' }}>{TX.save[langKey] || TX.save.en}</button>
                   <button onClick={() => setShowAddFamily(false)} style={{ flex: 1, background: 'transparent', color: '#c4653a', border: '1px solid #c4653a', borderRadius: 6, padding: 8, fontSize: 12, cursor: 'pointer' }}>{TX.cancel[langKey] || TX.cancel.en}</button>
                 </div>
               </div>
             )}

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               {family.map((f, i) => (
                 <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                   <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#c4653a', color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {f.name[0]?.toUpperCase()}
                   </div>
                   <div>
                     <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{f.name}</div>
                     <div style={{ fontSize: 11, color: '#6b5e50' }}>{f.relation} • {f.age} {TX.yrs[langKey] || TX.yrs.en}</div>
                   </div>
                 </div>
               ))}
               {family.length === 0 && (
                 <div style={{ gridColumn: '1 / -1', border: '1px dashed #e8d5bc', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                   <div style={{ fontSize: 13, color: '#6b5e50', marginBottom: 10 }}>No family members added yet.</div>
                   {!showAddFamily && (
                     <button onClick={() => setShowAddFamily(true)} style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                       {TX.addMember[langKey] || TX.addMember.en}
                     </button>
                   )}
                 </div>
               )}
             </div>
          </div>
          )}
        </div>

        {/* SECTION: Medical Info */}
        {!isAshaViewingPatient && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8d5bc' }}>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', fontWeight: 600, marginBottom: 16 }}>💊 Medical Info</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Allergies */}
            <div>
              <label style={{ fontSize: 12, color: '#6b5e50', fontWeight: 600, display: 'block', marginBottom: 6 }}>Known Allergies</label>
              <input 
                value={medicalInfo.allergies}
                onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                placeholder="e.g. Penicillin, Shellfish"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #e8d5bc', borderRadius: 8 }}
              />
            </div>

            {/* Chronic Conditions */}
            <div>
              <label style={{ fontSize: 12, color: '#6b5e50', fontWeight: 600, display: 'block', marginBottom: 8 }}>Chronic Conditions</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'None'].map(condition => (
                  <button
                    key={condition}
                    onClick={() => {
                      const updated = medicalInfo.chronicConditions.includes(condition)
                        ? medicalInfo.chronicConditions.filter(c => c !== condition)
                        : [...medicalInfo.chronicConditions, condition]
                      setMedicalInfo({...medicalInfo, chronicConditions: updated})
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      borderRadius: 12,
                      border: medicalInfo.chronicConditions.includes(condition) ? 'none' : '1px solid #e8d5bc',
                      background: medicalInfo.chronicConditions.includes(condition) ? '#0f3d2a' : '#fff',
                      color: medicalInfo.chronicConditions.includes(condition) ? '#fff' : '#6b5e50',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label style={{ fontSize: 12, color: '#6b5e50', fontWeight: 600, display: 'block', marginBottom: 6 }}>Emergency Contact Name</label>
              <input 
                value={medicalInfo.emergencyName}
                onChange={(e) => setMedicalInfo({...medicalInfo, emergencyName: e.target.value})}
                placeholder="e.g. Mother, Brother"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #e8d5bc', borderRadius: 8, marginBottom: 10 }}
              />
              <label style={{ fontSize: 12, color: '#6b5e50', fontWeight: 600, display: 'block', marginBottom: 6 }}>Emergency Contact Phone</label>
              <input 
                value={medicalInfo.emergencyPhone}
                onChange={(e) => setMedicalInfo({...medicalInfo, emergencyPhone: e.target.value})}
                placeholder="10-digit phone number"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #e8d5bc', borderRadius: 8 }}
              />
            </div>

            <button 
              onClick={() => {
                localStorage.setItem('gd_patient_medical_info', JSON.stringify(medicalInfo))
                const current = safeParse(localStorage.getItem('gd_patient_profile'), {})
                localStorage.setItem('gd_patient_profile', JSON.stringify({ ...current, medical: medicalInfo, updatedAt: new Date().toISOString() }))
                toast.success('Medical info saved!')
              }}
              style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
            >
              Save Medical Info
            </button>
          </div>
        </div>
        )}

        {/* Health History removed per request (no prescriptions shown here) */}

        {/* SECTION: Insurance */}
        {!isAshaViewingPatient && (
        <div style={{ background: '#d4f1e8', borderRadius: 16, padding: 24, border: '1px solid #b5dcca' }}>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 14, color: '#0f3d2a', fontWeight: 600, marginBottom: 16 }}>🏥 Government Health Insurance</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Aarogya Setu */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={insuranceInfo.aarogya}
                onChange={(e) => {
                  setInsuranceInfo({...insuranceInfo, aarogya: e.target.checked})
                  if (e.target.checked) {
                    setInsuranceInfo(prev => ({...prev, aarogya: e.target.checked}))
                  }
                }}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f3d2a' }}>Aarogya Setu</span>
            </label>

            {/* PMJAY */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={insuranceInfo.pmjay}
                onChange={(e) => setInsuranceInfo({...insuranceInfo, pmjay: e.target.checked})}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f3d2a' }}>PMJAY / Ayushman Bharat</span>
            </label>

            {/* Aadhaar Input if Aarogya checked */}
            {insuranceInfo.aarogya && (
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #b5dcca' }}>
                <label style={{ fontSize: 11, color: '#0f3d2a', fontWeight: 600, display: 'block', marginBottom: 6 }}>Aadhaar Number</label>
                <input 
                  value={insuranceInfo.aadhaar}
                  onChange={(e) => setInsuranceInfo({...insuranceInfo, aadhaar: e.target.value})}
                  placeholder="Enter 12-digit Aadhaar"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #b5dcca', borderRadius: 6, marginBottom: 8 }}
                />
                <button 
                  onClick={() => {
                    if (insuranceInfo.aadhaar.length === 12) {
                      setInsuranceInfo({...insuranceInfo, coverageStatus: '✅ Coverage Active — Consultations covered up to ₹5L/year'})
                    } else {
                      toast.error('Please enter a valid 12-digit Aadhaar number')
                    }
                  }}
                  style={{ width: '100%', background: '#1d9e75', color: '#fff', border: 'none', borderRadius: 6, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Verify Coverage
                </button>
                {insuranceInfo.coverageStatus && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#0f3d2a', fontWeight: 600, padding: 8, background: '#fff', borderRadius: 6 }}>
                    {insuranceInfo.coverageStatus}
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => {
                localStorage.setItem('gd_patient_insurance', JSON.stringify(insuranceInfo))
                const current = safeParse(localStorage.getItem('gd_patient_profile'), {})
                localStorage.setItem('gd_patient_profile', JSON.stringify({ ...current, insurance: insuranceInfo, updatedAt: new Date().toISOString() }))
                toast.success('Insurance info saved!')
              }}
              style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
            >
              Save Insurance Info
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
