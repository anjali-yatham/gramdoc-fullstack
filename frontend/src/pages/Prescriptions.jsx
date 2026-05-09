import { useState, useEffect } from 'react'
import { api, dualSave, dualLoad, safeParse } from '../utils/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getSuggestedMedicines } from '../utils/healthConstants'
import { LANGS } from '../utils/translations'

export default function Prescriptions() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('view') // 'view' or 'write'
  const user = safeParse(localStorage.getItem('gramdoc_user'), {})
  const [tracker, setTracker] = useState({})
  const [prescriptionHistory, setPrescriptionHistory] = useState([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [reminders, setReminders] = useState([])
  const reminderTimes = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM']
  const lang = localStorage.getItem('gramdoc_lang') || 'en'
  const t = LANGS[lang]?.ui || LANGS.en.ui
  const TX = {
    noRxYet: { en: 'No prescriptions yet', hi: 'अभी तक कोई प्रिस्क्रिप्शन नहीं', te: 'ఇంకా ప్రిస్క్రిప్షన్లు లేవు' },
    findDoctor: { en: 'Find a Doctor →', hi: 'डॉक्टर खोजें →', te: 'డాక్టర్‌ను కనుగొనండి →' },
    myRx: { en: 'My Prescriptions', hi: 'मेरे प्रिस्क्रिप्शन', te: 'నా ప్రిస్క్రిప్షన్లు' },
    medicineTracker: { en: '💊 Medicine Tracker', hi: '💊 दवा ट्रैकर', te: '💊 మందుల ట్రాకర్' },
    trackDose: { en: 'Track your daily doses', hi: 'अपनी रोज़ की दवाएं ट्रैक करें', te: 'రోజువారీ మోతాదులను ట్రాక్ చేయండి' },
    followUp: { en: '📅 Follow-up Appointment', hi: '📅 फॉलो-अप अपॉइंटमेंट', te: '📅 ఫాలో-అప్ అపాయింట్మెంట్' },
    noFollowUp: { en: 'No follow-up set', hi: 'कोई फॉलो-अप सेट नहीं', te: 'ఫాలో-అప్ సెట్ కాలేదు' },
    followUpWith: { en: 'Follow-up with', hi: 'फॉलो-अप', te: 'ఫాలో-అప్' },
    whatsapp: { en: 'Send to WhatsApp', hi: 'व्हाट्सऐप पर भेजें', te: 'వాట్సాప్‌కు పంపండి' },
    addCalendar: { en: 'Add to Calendar 📅', hi: 'कैलेंडर में जोड़ें 📅', te: 'క్యాలెండర్‌కు జోడించండి 📅' },
    remindersTitle: { en: '🔔 Set Medicine Reminders', hi: '🔔 दवा रिमाइंडर सेट करें', te: '🔔 మందుల రిమైండర్లు సెట్చేయండి' },
    remindersSaved: { en: '📲 Reminders saved! We will notify you via WhatsApp', hi: '📲 रिमाइंडर सेव! हम आपको व्हाट्सऐप पर सूचित करेंगे', te: '📲 రిమైండర్లు సేవ్ అయ్యాయి! మేము వాట్సాప్ ద్వారా తెలియజేస్తాము' },
    sendSchedule: { en: 'Send reminder schedule to WhatsApp', hi: 'रिमाइंडर शेड्यूल व्हाट्सऐप पर भेजें', te: 'రిమైండర్ షెడ్యూల్‌ను వాట్సాప్‌కు పంపండి' },
    backDash: { en: '← Back to Dashboard', hi: '← डैशबोर्ड पर वापस', te: '← డ్యాష్‌బోర్డ్‌కు వెనక్కి' }
  }

  const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

  const upsertPrescriptionHistory = (nextRx, existing) => {
    const items = Array.isArray(existing) ? [...existing] : []
    const nextPatient = normalizeName(nextRx.patientName || nextRx.patient?.name)
    const nextDoctor = normalizeName(nextRx.doctorName || nextRx.doctor?.name)
    const nextDiagnosis = normalizeName(nextRx.diagnosis)
    const nextConsultId = nextRx.consultationId || null
    const nextTime = new Date(nextRx.createdAt || Date.now()).getTime()

    const idx = items.findIndex(rx => {
      const samePatient = normalizeName(rx.patientName || rx.patient?.name) === nextPatient
      const sameDoctor = normalizeName(rx.doctorName || rx.doctor?.name) === nextDoctor
      const sameDiagnosis = normalizeName(rx.diagnosis) === nextDiagnosis
      const sameConsult = nextConsultId && rx.consultationId && rx.consultationId === nextConsultId
      const existingTime = new Date(rx.createdAt || 0).getTime()
      const nearTime = Math.abs(existingTime - nextTime) <= 20 * 60 * 1000
      return sameConsult || (samePatient && sameDoctor && sameDiagnosis && nearTime)
    })

    if (idx >= 0) {
      items[idx] = { ...items[idx], ...nextRx }
      return items
    }
    return [nextRx, ...items]
  }

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

  useEffect(() => {
    async function loadHistory() {
      const h = await dualLoad('gd_prescription_history', [])
      setPrescriptionHistory(h)
      
      const allTrackers = {}
      h.forEach(rx => {
        const saved = localStorage.getItem(`gd_tracker_${rx._id}`)
        if (saved) allTrackers[rx._id] = JSON.parse(saved)
      })

      // Check if we came from Profile "View Rx"
      const viewReq = safeParse(localStorage.getItem('gd_view_prescription'), null)
      if (viewReq) {
        const found = h.find(r => (r._id === viewReq._id) || (r.patientName === viewReq.patientName && r.diagnosis === viewReq.diagnosis))
        if (found) {
          setSelected(found)
          setMode('view')
        }
        localStorage.removeItem('gd_view_prescription')
      }

      const finalRx = safeParse(localStorage.getItem('gd_prescription_final'), {})
      if (finalRx._id) {
          const saved = localStorage.getItem(`gd_tracker_${finalRx._id}`)
          if (saved) allTrackers[finalRx._id] = safeParse(saved, {})
      }
      setTracker(allTrackers)
    }
    loadHistory()
  }, [selected])

  useEffect(() => {
    const saved = safeParse(localStorage.getItem('gd_reminders'), [])
    setReminders(Array.isArray(saved) ? saved : [])
  }, [])

  const toggleTracker = (prescriptionId, medIdx, dayIdx) => {
    const key = `gd_tracker_${prescriptionId}`
    const currentTracker = safeParse(localStorage.getItem(key), {})
    
    if (!currentTracker[medIdx]) currentTracker[medIdx] = {}
    currentTracker[medIdx][dayIdx] = !currentTracker[medIdx][dayIdx]
    
    setTracker(prev => ({ ...prev, [prescriptionId]: currentTracker }))
    dualSave(key, currentTracker)
  }

  const upsertReminder = (item, patch) => {
    const current = safeParse(localStorage.getItem('gd_reminders'), [])
    const next = Array.isArray(current) ? [...current] : []
    const idx = next.findIndex(r =>
      r.prescriptionId === item.prescriptionId &&
      r.medicine === item.medicine
    )
    const record = {
      medicine: item.medicine,
      time: patch.time || item.time || '8AM',
      enabled: typeof patch.enabled === 'boolean' ? patch.enabled : !!item.enabled,
      prescriptionId: item.prescriptionId
    }
    if (idx >= 0) next[idx] = { ...next[idx], ...record }
    else next.push(record)
    localStorage.setItem('gd_reminders', JSON.stringify(next))
    setReminders(next)
    toast.success('📲 Reminders saved! We will notify you via WhatsApp')
  }

  const getReminder = (prescriptionId, medicine) =>
    reminders.find(r => r.prescriptionId === prescriptionId && r.medicine === medicine) || {
      prescriptionId,
      medicine,
      time: '8AM',
      enabled: false
    }

  const sendReminderScheduleToWhatsapp = (rx) => {
    const schedule = reminders.filter(r => r.prescriptionId === rx._id && r.enabled)
    if (schedule.length === 0) {
      toast.error('Enable at least one reminder first')
      return
    }
    let msg = `*GramDoc Medicine Reminder Schedule*\nPrescription: ${rx._id}\nPatient: ${rx.patientName}\n\n`
    schedule.forEach((r) => {
      msg += `- ${r.medicine}: ${r.time}\n`
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleOrderToPharmacy = (rx) => {
    if (!rx || !Array.isArray(rx.medicines) || rx.medicines.length === 0) {
      toast.error('No medicines to order')
      return
    }
    const cart = rx.medicines.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions }))
    localStorage.setItem('gd_order_cart', JSON.stringify({ prescriptionId: rx._id, patientName: rx.patientName || rx.patient?.name, items: cart }))
    navigate('/app/pharmacy-dashboard')
  }

  const openCalendarEvent = (dateValue, title, details) => {
    if (!dateValue) {
      toast.error('No follow-up date set')
      return
    }
    const dateObj = new Date(dateValue)
    if (Number.isNaN(dateObj.getTime())) {
      toast.error('Invalid follow-up date')
      return
    }
    const dateStr = dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDateObj = new Date(dateObj.getTime() + 30 * 60 * 1000)
    const endDateStr = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(details)}`
    window.open(url, '_blank')
  }

  // Write Mode State
  const [patientName, setPatientName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [meds, setMeds] = useState([])
  const [newMed, setNewMed] = useState({ 
    name: '', 
    dosage: '', 
    frequency: 'Once a day',
    duration: '', 
    durationUnit: 'Days',
    timing: 'After food',
    instructions: ''
  })
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (diagnosis) {
      setSuggestions(getSuggestedMedicines(diagnosis))
    } else {
      setSuggestions([])
    }
  }, [diagnosis])
  
  // Patient Info State
  const [patientInfo, setPatientInfo] = useState({ name: '', age: '', id: '', village: '' })

  useEffect(() => {
    let modeSet = false
    let finalSelected = null

    const currentUser = user || {}
    const currentDoctorName = currentUser.name || ''

    // 1. Check for post-consultation write mode
    const postConsult = safeParse(localStorage.getItem('gd_post_consultation'), null)
    const activePatient = safeParse(localStorage.getItem('gd_active_patient'), null)
    const viewData = safeParse(localStorage.getItem('gd_view_prescription'), null)

    if (postConsult && postConsult.mode === 'write') {
      const triage = safeParse(localStorage.getItem('gd_triage'), null)
      const triageSymptoms = Array.isArray(triage?.symptoms)
        ? triage.symptoms.join(', ')
        : (triage?.symptoms || '')
      setMode('write')
      setPatientName(postConsult.patientName || '')
      setDiagnosis(postConsult.symptoms || triageSymptoms || '')
      setDoctorName(currentDoctorName || '')
      setPatientInfo({
        name: postConsult.patientName || '',
        age: postConsult.patientAge || '',
        village: postConsult.patientVillage || '',
        id: `GD-${Date.now().toString().slice(-6)}`
      })
      localStorage.removeItem('gd_post_consultation')
      modeSet = true
    }

    if (!modeSet && activePatient) {
      setPatientInfo({
        name: activePatient.name || '',
        age: activePatient.age || '',
        village: activePatient.village || '',
        id: `GD-${Date.now().toString().slice(-6)}`
      })
      setPatientName(activePatient.name || '')
    }

    // 2. Check for view prescription from recent consultations
    if (!modeSet && viewData) {
      const data = safeParse(viewData, {})
      setMode('view')
      const viewRx = {
        _id: 'view-' + Date.now(),
        doctor: { name: currentDoctorName || 'Doctor', specialization: user.specialization || '' },
        patientName: data.patientName,
        diagnosis: data.diagnosis,
        medicines: safeParse(localStorage.getItem('gd_prescription_final'), {}).medicines || [],
        advice: data.advice || '',
        createdAt: new Date().toISOString(),
        followUpDate: data.followUpDate || null
      }
      finalSelected = viewRx
      setPatientInfo({
        name: data.patientName || '',
        age: data.patientAge || '',
        village: data.patientVillage || '',
        id: `GD-${Date.now().toString().slice(-6)}`
      })
      localStorage.removeItem('gd_view_prescription')
      modeSet = true
    }

    const isDoc = user.role === 'doctor'
    const myName = user.name || ''
    const myNameNorm = normalizeName(myName)

    const myPrescriptions = prescriptionHistory.filter(rx => {
      if (isDoc) {
        return normalizeName(rx.doctorName) === myNameNorm || normalizeName(rx.doctor?.name) === myNameNorm
      }
      const patientNameNorm = normalizeName(rx.patientName || rx.patient?.name)
      return !!myNameNorm && patientNameNorm === myNameNorm
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    let dataToSet = [...myPrescriptions]
    const savedMeds = localStorage.getItem('gd_prescription_medicines')
    
    let initialRx = finalSelected
    if (savedMeds && !initialRx) {
      const medicines = safeParse(savedMeds, [])
      initialRx = {
        _id: 'new-rx-' + Date.now(),
        doctor: { name: currentDoctorName, specialization: user.specialization || 'Consultant' },
        doctorName: currentDoctorName,
        medicines: medicines,
        diagnosis: '',
        advice: '',
        createdAt: new Date().toISOString(),
        followUpDate: null
      }
      dataToSet = [initialRx, ...dataToSet]
      localStorage.removeItem('gd_prescription_medicines')
    }

    if (!initialRx) {
      const finalSaved = localStorage.getItem('gd_prescription_final')
      if (finalSaved) {
        const parsed = safeParse(finalSaved, {})
        if (
          normalizeName(parsed.doctorName) === normalizeName(currentDoctorName) ||
          normalizeName(parsed.doctor?.name) === normalizeName(currentDoctorName)
        ) {
            initialRx = parsed
            if (!dataToSet.find(r => r._id === initialRx._id)) {
                dataToSet = [initialRx, ...dataToSet]
            }
        }
      }
    }
    
    if (!initialRx && dataToSet.length > 0) {
      initialRx = dataToSet[0]
    }

    setPrescriptions(dataToSet)
    if (initialRx) setSelected(initialRx)
    setLoading(prescriptionHistory.length === 0 && loading)
  }, [prescriptionHistory])

  const handleAddMed = () => {
    if (!newMed.name) return toast.error('Medicine name required')
    setMeds([...meds, { ...newMed, id: Date.now() }])
    setNewMed({ 
      name: '', 
      dosage: '', 
      frequency: 'Once a day',
      duration: '', 
      durationUnit: 'Days',
      timing: 'After food',
      instructions: ''
    })
  }

  const handleRemoveMed = (id) => {
    setMeds(meds.filter(m => m.id !== id))
  }

  const handleDeleteRx = async (id) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        const updated = prescriptionHistory.filter(rx => rx._id !== id)
        await dualSave('gd_prescription_history', updated)
        setPrescriptionHistory(updated)
        
        if (api.deletePrescription) {
          await api.deletePrescription(id)
        }
        toast.success('Prescription deleted')
      } catch (err) {
        console.error('Delete failed:', err)
        toast.error('Failed to delete prescription. Please try again.')
      }
    }
  }

  const handleSaveAndSend = (viaWhatsApp) => {
    if (!diagnosis) return toast.error('Diagnosis required')
    
    const user = api.getUser() || {}
    const initial = (user.name || 'DR').replace(/\s/g,'').slice(0,3).toUpperCase()
    const recordId = initial + '-' + Date.now().toString().slice(-6)

    let activePatient = safeParse(localStorage.getItem('gd_active_patient'), {})
    let postConsult = safeParse(localStorage.getItem('gd_post_consultation'), {})
    
    const resolvedPatientName = patientName 
      || activePatient.name 
      || 'Not provided'

    const finalRx = {
      _id: recordId,
      doctor: { name: user.name, specialization: user.specialization || 'Consultant' },
      doctorName: user.name,
      patientName: resolvedPatientName,
      village: activePatient.village || postConsult.patientVillage || patientInfo.village || 'Village not recorded',
      diagnosis: diagnosis || 'General Consultation',
      medicines: meds,
      advice: advice || '',
      followUpDate: followUp || '',
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = upsertPrescriptionHistory(finalRx, prescriptionHistory)
    dualSave('gd_prescription_history', updated)
    setPrescriptionHistory(updated)

    localStorage.setItem('gd_prescription_final', JSON.stringify(finalRx))

    const statusMap = safeParse(localStorage.getItem('gd_consultation_status'), {})
    statusMap[resolvedPatientName] = 'Prescription sent'
    localStorage.setItem('gd_consultation_status', JSON.stringify(statusMap))

    const recent = safeParse(localStorage.getItem('gd_recent'), [])
    const existingRecent = recent.find(c => c.name === resolvedPatientName)
    let updatedRecent = [...recent]
    if (existingRecent) {
      updatedRecent = updatedRecent.map(c =>
        c.name === resolvedPatientName
          ? { ...c, status: 'Prescription sent ✓', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c
      )
    } else {
      updatedRecent = [{
        name: resolvedPatientName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diag: diagnosis,
        status: 'Prescription sent ✓'
      }, ...updatedRecent]
    }
    localStorage.setItem('gd_recent', JSON.stringify(updatedRecent))

    setPrescriptions(updated)
    setSelected(finalRx)
    setMode('view')
    toast.success('Prescription saved!')

    if (viaWhatsApp) {
      let msg = `*GramDoc Prescription*\nDoctor: ${user.name}\nPatient: ${resolvedPatientName}\nDiagnosis: ${diagnosis}\n\n*Medicines:*\n`
      const finalMeds = Array.isArray(meds) ? meds : []
      finalMeds.forEach(m => {
        msg += `- ${m.name}\n  ${m.dosage} · ${m.frequency}\n  ${m.timing} · ${m.duration} ${m.durationUnit}\n`
        if (m.instructions) msg += `  Note: ${m.instructions}\n`
      })
      if (advice) msg += `\n*Advice:* ${advice}`
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')

      localStorage.removeItem('gd_active_patient')
      localStorage.removeItem('gd_call_start')
      localStorage.removeItem('gd_consultation_id')
    }
  }

  async function handleSavePrescription() {
    // 1. Validate
    if (!diagnosis.trim()) {
      toast.error('Please enter diagnosis')
      return
    }

    // Auto-add current medicine if fields are filled but "+" wasn't clicked
    let finalMeds = [...meds]
    if (finalMeds.length === 0 && newMed.name.trim()) {
      finalMeds.push({ ...newMed, id: Date.now() })
    }

    if (finalMeds.length === 0) {
      toast.error('Please add at least one medicine')
      return
    }

    // 2. Build prescription object
    const activePatient = safeParse(localStorage.getItem('gd_active_patient'), {})
    const resolvedPatientName = patientName || activePatient.name || 'Patient'
    const resolvedVillage = activePatient.village || patientInfo.village || 'Village not recorded'

    const rxId = `RX-${Date.now()}`
    const prescription = {
      _id: rxId,
      id: rxId,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctor: {
        name: user?.name || 'Doctor',
        specialization: user?.specialization || '',
      },
      doctorName: user?.name || 'Doctor',
      patient: {
        name: resolvedPatientName,
        village: resolvedVillage
      },
      patientName: resolvedPatientName,
      village: resolvedVillage,
      diagnosis: diagnosis,
      medicines: finalMeds,
      advice: advice || '',
      followUpDate: followUp || null,
      qrCode: `GD-RX-${rxId.split('-')[1]}`, // Better QR code string
    }

    // 3. Save to localStorage for patient to see
    const updated = upsertPrescriptionHistory(prescription, prescriptionHistory)
    dualSave('gd_prescription_history', updated)
    setPrescriptionHistory(updated)
    localStorage.setItem('gd_prescription_final', JSON.stringify(prescription))

    // 4. Try save to backend API
    try {
      await api.savePrescription(prescription)
      toast.success('✅ Prescription saved! Patient can view it now.')
      
      // 5. Cleanup session data
      localStorage.removeItem('gd_active_patient')
      localStorage.removeItem('gd_call_start')
      localStorage.removeItem('gd_consultation_id')
      localStorage.removeItem('gd_triage')
      
    } catch(e) {
      toast.error('Sync failed, but saved locally. It will sync when connection returns.')
      console.error('Prescription Sync Error:', e)
    }

    // 6. Reset form
    setDiagnosis('')
    setMeds([])
    setAdvice('')
    setFollowUp('')

    // 7. Navigate back to dashboard
    setTimeout(() => {
      navigate('/app/doctor-dashboard')
    }, 1500)
  }

  const handlePrint = () => {
    if (!selected) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    const medsArr = Array.isArray(selected.medicines) ? selected.medicines : []
    let medsHtml = '<p>No medicines prescribed.</p>'
    if (medsArr.length > 0) {
      medsHtml = medsArr.map(function(m) {
        return '<div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">'
          + '<div style="font-weight: bold; color: #0f3d2a;">' + m.name + '</div>'
          + '<div style="font-size: 13px; color: #666; margin-top: 4px;">' + m.dosage + ' &middot; ' + (m.frequency || 'Once a day') + ' &middot; ' + m.timing + '</div>'
          + '<div style="font-size: 13px; color: #666;">Duration: ' + m.duration + ' ' + (m.durationUnit || '') + '</div>'
          + (m.instructions ? '<div style="font-size: 12px; color: #c4653a; font-style: italic; margin-top: 4px;">Note: ' + m.instructions + '</div>' : '')
          + '</div>'
      }).join('')
    }

    const html = `
      <html>
        <head>
          <title>Prescription - ${selected.patientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Mukta:wght@200;300;400;500;600;700;800&display=swap');
            body { font-family: 'Mukta', sans-serif; color: #0f3d2a; padding: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f3d2a; padding-bottom: 20px; margin-bottom: 30px; }
            .doctor-info { text-align: right; }
            .doc-name { font-family: 'Fraunces', serif; font-style: italic; font-size: 24px; color: #0f3d2a; margin: 0; }
            .doc-meta { font-size: 13px; color: #666; }
            .patient-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .section-title { font-size: 12px; font-weight: 800; color: #666; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .diagnosis-box { background: #fdf6ec; padding: 15px; border-radius: 8px; border-left: 4px solid #c4653a; margin-bottom: 30px; }
            .stamp { display: inline-block; border: 2px solid #1d9e75; color: #1d9e75; padding: 5px 15px; border-radius: 4px; font-weight: 800; font-size: 12px; transform: rotate(-5deg); margin-top: 20px; }
            .footer { margin-top: 50px; pt: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-family: 'Fraunces', serif; font-style: italic; font-size: 28px; color: #0f3d2a;">GramDoc</div>
              <div style="font-size: 11px; color: #666; letter-spacing: 1px;">RURAL HEALTH SYSTEMS</div>
            </div>
            <div class="doctor-info">
              <p class="doc-name">Dr. ${selected.doctorName || user.name || 'Doctor'}</p>
              <p class="doc-meta">${user.specialization || 'General Physician'}</p>
              <p class="doc-meta">Reg No: ${user.regNumber || 'Not provided'}</p>
            </div>
          </div>

          <div class="patient-section">
            <div>
              <div class="section-title">Patient Details</div>
              <div style="font-weight: bold; font-size: 16px;">${selected.patientName}</div>
              <div style="font-size: 13px; color: #666;">ID: ${selected.patientId || 'Not provided'}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-title">Prescription Info</div>
              <div style="font-size: 13px;">Date: ${new Date(selected.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style="font-size: 13px;">Rx ID: ${selected._id || 'RX-' + Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            </div>
          </div>

          <div class="diagnosis-box">
            <div class="section-title">Diagnosis</div>
            <div style="font-weight: 600;">${selected.diagnosis || 'General Consultation'}</div>
          </div>

          <div class="section-title">Prescribed Medicines</div>
          <div style="margin-bottom: 30px;">
            ${medsHtml}
          </div>

          ${selected.advice ? `
            <div style="margin-bottom: 30px; background: #eaf3de; padding: 15px; border-radius: 8px;">
              <div class="section-title">Doctor's Advice</div>
              <div style="font-size: 14px;">${selected.advice}</div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div class="section-title">Follow-up Date</div>
              <div style="font-weight: bold; color: #c4653a;">${selected.followUpDate ? new Date(selected.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'As needed'}</div>
              <div class="stamp">MCI VERIFIED</div>
            </div>
            <div style="text-align: right;">
              <div style="margin-top: 40px; border-top: 1px solid #0f3d2a; width: 150px; padding-top: 5px; font-size: 12px; font-weight: bold;">Doctor's Signature</div>
            </div>
          </div>

          <div class="footer">
            <div>This is a digitally generated prescription by GramDoc.</div>
            <div>www.gramdoc.in</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleBackToDashboard = () => {
    const user = api.getUser()
    const activePatient = safeParse(localStorage.getItem('gd_active_patient'), {})
    const recent = safeParse(localStorage.getItem('gd_recent'), [])
    if (recent.length > 0 && activePatient?.name) {
      const updated = recent.map(r =>
        r.name === activePatient.name ? { ...r, status: 'Prescription sent ✓' } : r
      )
      localStorage.setItem('gd_recent', JSON.stringify(updated))
    }
    localStorage.removeItem('gd_active_patient')
    localStorage.removeItem('gd_call_start')
    localStorage.removeItem('gd_consultation_id')
    
    if (user?.role === 'doctor') {
      navigate('/app/doctor-dashboard')
    } else {
      navigate('/app')
    }
  }

  const date = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const dateTime = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
  const doctorPrefix = { en: 'Dr.', hi: 'डॉ.', te: 'డా.' }[lang] || 'Dr.'
  const diagnosisForLang = (rx) =>
    rx?.[`diagnosis_${lang}`]
    || rx?.diagnosisByLang?.[lang]
    || rx?.diagnosis
    || 'Not provided'
  const doctorNameForLang = (rx) => `${doctorPrefix} ${rx?.doctorName || rx?.doctor?.name || 'Not provided'}`
  const dedupePatientHistory = (items) => {
    const sorted = [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    const kept = []
    for (const rx of sorted) {
      const createdAt = new Date(rx.createdAt || 0).getTime()
      const duplicate = kept.find(k => {
        const samePatient = normalizeName(k.patientName || k.patient?.name) === normalizeName(rx.patientName || rx.patient?.name)
        const sameDoctor = normalizeName(k.doctorName || k.doctor?.name) === normalizeName(rx.doctorName || rx.doctor?.name)
        const sameDiagnosis = normalizeName(k.diagnosis) === normalizeName(rx.diagnosis)
        const nearTime = Math.abs(new Date(k.createdAt || 0).getTime() - createdAt) <= 20 * 60 * 1000
        const relatedConsult = (k.consultationId && rx.consultationId && k.consultationId === rx.consultationId) || (samePatient && sameDoctor && sameDiagnosis && nearTime)
        return relatedConsult
      })
      if (!duplicate) {
        kept.push(rx)
        continue
      }
      const duplicatePending = duplicate.status === 'pending_doctor_prescription'
      const currentPending = rx.status === 'pending_doctor_prescription'
      if (duplicatePending && !currentPending) {
        const idx = kept.indexOf(duplicate)
        kept[idx] = rx
      }
    }
    return kept
  }

  if (loading && mode === 'view') return <div style={{ textAlign:'center', padding:40 }}>Loading prescriptions...</div>

  const currentUser = api.getUser()
  const isDoc = currentUser?.role === 'doctor'

  if (!isDoc) {
    const myNameNorm = normalizeName(currentUser?.name)
    let myHistory = prescriptionHistory.filter(rx => {
      const patientNameNorm = normalizeName(rx.patientName || rx.patient?.name)
      return !!myNameNorm && patientNameNorm === myNameNorm
    })

    if (myHistory.length === 0) {
      const finalRx = safeParse(localStorage.getItem('gd_prescription_final'), null)
      if (finalRx) {
        const finalPatientNorm = normalizeName(finalRx.patientName || finalRx.patient?.name)
        if (finalPatientNorm && finalPatientNorm === myNameNorm) {
          myHistory = [finalRx]
        }
      }
    }

    const showDefault = myHistory.length === 0
    const defaultRx = {
      _id: 'default-rx',
      createdAt: new Date().toISOString(),
      doctorName: 'General Physician',
      diagnosis: 'General Wellness Check',
      medicines: [],
      advice: 'Stay hydrated, eat balanced meals, and rest well.'
    }
    if (showDefault) {
      myHistory = [defaultRx]
    }

    const sortedHistory = dedupePatientHistory(myHistory)
    const viewRx = selected && normalizeName(selected.patientName || selected.patient?.name) === myNameNorm
      ? selected
      : sortedHistory[0]

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 40px' }}>
        <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 24, color: '#0f3d2a', marginBottom: 16 }}>{TX.myRx[lang] || TX.myRx.en}</h1>
        {showDefault && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8d5bc', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a', marginBottom: 6 }}>{TX.noRxYet[lang] || TX.noRxYet.en}</div>
            <div style={{ fontSize: 12, color: '#6b5e50' }}>Here is a general wellness note until your first consultation.</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedHistory.map((rx, i) => (
            <div key={rx._id || i} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8d5bc', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b5e50', marginBottom: 6 }}>{dateTime(rx.createdAt || rx.date)}</div>
                <div style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 700 }}>{doctorNameForLang(rx)}</div>
                <div style={{ fontSize: 13, color: '#0f3d2a', marginTop: 4, fontStyle: 'italic' }}>{diagnosisForLang(rx)}</div>
              </div>
              <button
                onClick={() => setSelected(rx)}
                style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                View
              </button>
            </div>
          ))}
        </div>

        {viewRx && (
          <div style={{ marginTop: 18, background: '#fff', border: '1px solid #e8d5bc', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, color: '#6b5e50', marginBottom: 8 }}>{dateTime(viewRx.createdAt || viewRx.date)}</div>
            <div style={{ fontSize: 15, color: '#0f3d2a', fontWeight: 700, marginBottom: 4 }}>{doctorNameForLang(viewRx)}</div>
            <div style={{ fontSize: 14, color: '#0f3d2a', fontStyle: 'italic', marginBottom: 14 }}>{diagnosisForLang(viewRx)}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid #e8d5bc', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a', marginBottom: 6 }}>{TX.medicineTracker[lang] || TX.medicineTracker.en}</div>
                <div style={{ fontSize: 11, color: '#6b5e50', marginBottom: 12 }}>{TX.trackDose[lang] || TX.trackDose.en}</div>
                {viewRx.medicines?.length > 0 ? viewRx.medicines.map((m, mi) => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  return (
                    <div key={`${m.name}-${mi}`} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a', marginBottom: 8 }}>{m.name} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {m.dosage}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {days.map((day, di) => (
                          <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 9, color: '#6b5e50' }}>{day}</div>
                            <motion.div
                              whileTap={{ scale: 0.85 }}
                              onClick={() => toggleTracker(viewRx._id, mi, di)}
                              style={{
                                width: 24, height: 24, borderRadius: '50%',
                                border: tracker[viewRx._id]?.[mi]?.[di] ? 'none' : '2px solid #e8d5bc',
                                background: tracker[viewRx._id]?.[mi]?.[di] ? '#0f3d2a' : 'transparent',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11
                              }}
                            >
                              {tracker[viewRx._id]?.[mi]?.[di] ? '✓' : ''}
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }) : <div style={{ fontSize: 12, color: '#6b5e50' }}>No medicines added yet.</div>}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #e8d5bc', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a', marginBottom: 8 }}>{TX.followUp[lang] || TX.followUp.en}</div>
                <div style={{ background: '#EAF3DE', padding: '12px 14px', borderRadius: 10, border: '1px solid #7bcaa4' }}>
                  <div style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>
                    📅 {viewRx.followUpDate ? new Date(viewRx.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (TX.noFollowUp[lang] || TX.noFollowUp.en)} — {TX.followUpWith[lang] || TX.followUpWith.en} {doctorNameForLang(viewRx)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Back Link */}
      <div 
        onClick={() => navigate(-1)} 
        style={{ color: '#6b5e50', fontSize: 12, marginBottom: 12, cursor: 'pointer', display: 'inline-block' }}
      >
        ← Back
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mode === 'view' ? '280px 1fr' : '1fr', gap: 24, height: 'calc(100vh - 180px)' }}>
        
        {/* SIDEBAR (Only in View Mode) */}
        {mode === 'view' && (
          <div style={{ overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: '#6b5e50', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Prescriptions</div>
            {prescriptions.length > 0 ? prescriptions.map(rx => (
              <div key={rx._id} style={{ position: 'relative', marginBottom: 8 }}>
                <div 
                  onClick={() => setSelected(rx)} 
                  style={{ 
                    background: selected?._id === rx._id ? '#0f3d2a' : '#fff', 
                    borderRadius: 12, 
                    padding: '14px 16px', 
                    border: '0.5px solid #e8d5bc', 
                    cursor: 'pointer', 
                    transition: 'all 0.15s',
                    paddingRight: 40
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected?._id === rx._id ? '#fff' : '#0f3d2a' }}>{rx.patientName || 'Unknown Patient'}</div>
                  <div style={{ fontSize: 11, color: selected?._id === rx._id ? 'rgba(255,255,255,0.6)' : '#6b5e50', marginTop: 3 }}>
                    {(rx.doctorName || rx.doctor?.name || 'Doctor')}
                  </div>
                  <div style={{ fontSize: 10, color: selected?._id === rx._id ? '#7bcaa4' : '#c4653a', fontWeight: 700, marginTop: 4 }}>{rx.diagnosis || 'Consultation'}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteRx(rx._id); }}
                  style={{ 
                    position: 'absolute', 
                    top: 14, 
                    right: 12, 
                    background: 'none', 
                    border: 'none', 
                    color: selected?._id === rx._id ? 'rgba(255,255,255,0.4)' : '#6b5e50', 
                    cursor: 'pointer', 
                    fontSize: 16 
                  }}
                >
                  🗑️
                </button>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px dashed #e8d5bc' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', marginBottom: 4 }}>No prescriptions yet</div>
                <div style={{ fontSize: 11, color: '#6b5e50' }}>Prescriptions you write will appear here</div>
              </div>
            )}
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8d5bc', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          
          {/* HEADER */}
          <div style={{ background: '#fdf6ec', padding: '20px 28px', borderBottom: '1px solid #e8d5bc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 22, color: '#0f3d2a', margin: 0 }}>
                {mode === 'write' ? 'Write Prescription ✏️' : '📜 Digital Prescription'}
              </h1>
              <div style={{ fontSize: 12, color: '#6b5e50', marginTop: 4 }}>
                {mode === 'write' ? `For: ${patientName || 'Not set'}` : `Record ID: ${selected?._id || 'Not available'}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a' }}>{user?.name || 'Not provided'}</div>
              <div style={{ fontSize: 11, color: '#6b5e50' }}>{user?.specialization || 'Not provided'}</div>
              <div style={{ fontSize: 10, color: user?.isVerified ? '#1d9e75' : '#c4653a', fontWeight: 700, marginTop: 2 }}>
                {user?.isVerified ? 'MCI-VERIFIED' : 'UNVERIFIED'}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
            
            {/* PATIENT INFO SECTION */}
            <div style={{ marginBottom: 24, borderBottom: '1px solid #f7f3ed', paddingBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#c4653a', letterSpacing: '0.05em', marginBottom: 8 }}>PATIENT</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f3d2a' }}>{patientInfo.name || selected?.patientName || 'Not set'}</div>
                {patientInfo.age && <div style={{ fontSize: 12, color: '#6b5e50' }}>{patientInfo.age} yrs</div>}
                <div style={{ fontSize: 10, color: '#6b5e50', marginLeft: 'auto' }}>ID: {patientInfo.id || selected?.patientId || 'Not available'}</div>
              </div>
            </div>

            {mode === 'write' ? (
              /* WRITE MODE FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <section>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 8, display: 'block' }}>DIAGNOSIS & SYMPTOMS</label>
                  <textarea 
                    value={diagnosis} 
                    onChange={e => setDiagnosis(e.target.value)} 
                    placeholder="Enter diagnosis (e.g. Fever, Cough)..."
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #e8d5bc', fontSize: 14, minHeight: 80, outline: 'none' }}
                  />
                  
                  {suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: 12, background: '#EAF3DE', borderRadius: 12, border: '1px solid #7bcaa4' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#0f3d2a', marginBottom: 8, textTransform: 'uppercase' }}>🪄 AI Suggested Medicines</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {suggestions.map((m, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setMeds([...meds, { ...m, id: Date.now() + idx }])}
                            style={{ background: '#fff', border: '1px solid #7bcaa4', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#0f3d2a', fontWeight: 600, cursor: 'pointer' }}
                          >
                            + {m.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </section>

                <section>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12, display: 'block' }}>💊 PRESCRIBE MEDICINES</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '4fr 2fr 4fr', gap: 10 }}>
                      <input value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} placeholder="Medicine Name" style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13 }} />
                      <input value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} placeholder="Dosage" style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13 }} />
                      <select value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13, background: '#fff' }}>
                        <option>Once a day</option>
                        <option>Twice a day</option>
                        <option>Three times a day</option>
                        <option>Every 8 hours</option>
                        <option>Every 12 hours</option>
                        <option>As needed</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 4fr auto', gap: 10 }}>
                      <input type="number" value={newMed.duration} onChange={e => setNewMed({...newMed, duration: e.target.value})} placeholder="e.g. 5" style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13 }} />
                      <select value={newMed.durationUnit} onChange={e => setNewMed({...newMed, durationUnit: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13, background: '#fff' }}>
                        <option>Days</option>
                      </select>
                      <select value={newMed.timing} onChange={e => setNewMed({...newMed, timing: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13, background: '#fff' }}>
                        <option>Before food</option>
                        <option>After food</option>
                        <option>With food</option>
                        <option>Early morning</option>
                        <option>At bedtime</option>
                        <option>As directed</option>
                      </select>
                      <button onClick={handleAddMed} style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                    <input value={newMed.instructions} onChange={e => setNewMed({...newMed, instructions: e.target.value})} placeholder="Special instructions (optional)..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e8d5bc', fontSize: 13 }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {meds.length > 0 ? meds.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f7f3ed', padding: '10px 16px', borderRadius: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontWeight: 700, color: '#0f3d2a', fontSize: 13 }}>{m.name}</span>
                          <span style={{ color: '#6b5e50', fontSize: 11 }}>{m.dosage} · {m.frequency}</span>
                          <span style={{ color: '#6b5e50', fontSize: 11 }}>{m.timing} · {m.duration} {m.durationUnit}</span>
                          {m.instructions && <span style={{ color: '#c4653a', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>Note: {m.instructions}</span>}
                        </div>
                        <button onClick={() => handleRemoveMed(m.id)} style={{ background: 'none', border: 'none', color: '#c4653a', cursor: 'pointer', fontSize: 18 }}>×</button>
                      </div>
                    )) : (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#fcfcfc', borderRadius: 12, border: '1px dashed #e8d5bc' }}>
                        <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic' }}>No medicines prescribed yet</div>
                        <div style={{ fontSize: 11, color: '#6b5e50', marginTop: 4 }}>Add medicines using the form above</div>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 8, display: 'block' }}>DOCTOR'S ADVICE</label>
                  <textarea 
                    value={advice} 
                    onChange={e => setAdvice(e.target.value)} 
                    placeholder="Additional advice (rest, diet, etc.)..."
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #e8d5bc', fontSize: 14, minHeight: 80, outline: 'none' }}
                  />
                </section>

                <section style={{ maxWidth: 240 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 8, display: 'block' }}>📅 FOLLOW-UP DATE</label>
                  <input 
                    type="date" 
                    value={followUp} 
                    onChange={e => setFollowUp(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e8d5bc', fontSize: 13 }}
                  />
                </section>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button 
                    onClick={handleSavePrescription}
                    style={{ flex: 1, background: '#fff', color: '#0f3d2a', border: '1px solid #0f3d2a', borderRadius: 12, padding: '16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save to Records
                  </button>
                  <button 
                    onClick={() => handleSaveAndSend(true)}
                    style={{ flex: 2, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Send to Patient via WhatsApp →
                  </button>
                </div>

                <motion.button
                  whileHover={{ background: '#EAF3DE' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBackToDashboard}
                  style={{
                    width: '100%', background: 'transparent', border: '1.5px solid #0f3d2a',
                    color: '#0f3d2a', borderRadius: 10, padding: '12px',
                    fontSize: 14, fontWeight: 600,
                    marginTop: 12, cursor: 'pointer', transition: 'background 0.2s'
                  }}
                >
                  ← Back to Dashboard
                </motion.button>
              </div>
            ) : (
              /* VIEW MODE */
              selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ background: '#fdf6ec', borderRadius: 12, padding: '16px 20px', borderLeft: '4px solid #c4653a' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#c4653a', textTransform: 'uppercase', marginBottom: 4 }}>Diagnosis</div>
                    <div style={{ fontSize: 15, color: '#0f3d2a', fontWeight: 600 }}>{selected.diagnosis || 'Not provided'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 12 }}>PRESCRIBED MEDICINES</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selected.medicines?.length > 0 ? selected.medicines.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px', background: '#f7f3ed', borderRadius: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f3d2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f3d2a' }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: '#6b5e50' }}>{m.dosage} · {m.frequency || 'Once a day'}</div>
                            <div style={{ fontSize: 11, color: '#6b5e50' }}>{m.timing} · {m.duration} {m.durationUnit || ''}</div>
                            {m.instructions && <div style={{ fontSize: 11, color: '#c4653a', fontStyle: 'italic', marginTop: 2 }}>Note: {m.instructions}</div>}
                          </div>
                        </div>
                      )) : (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#fcfcfc', borderRadius: 12, border: '1px dashed #e8d5bc' }}>
                          <div style={{ fontSize: 13, color: '#6b5e50', fontStyle: 'italic' }}>No medicines prescribed yet</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.advice && (
                    <div style={{ background: '#eaf3de', padding: '14px', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e50', marginBottom: 8 }}>ADVICE</div>
                      <div style={{ fontSize: 13, color: '#0f3d2a', lineHeight: 1.6 }}>{selected.advice}</div>
                    </div>
                  )}

                  {/* SECTION 1 — MEDICINE TRACKER */}
                  <div style={{ background: '#fff', border: '0.5px solid #e8d5bc', borderRadius: 14, padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a' }}>💊 Medicine Tracker</div>
                      <div style={{ fontSize: 11, color: '#6b5e50' }}>Track your daily doses</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {selected.medicines?.map((m, mi) => {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                        const todayIdx = (new Date().getDay() + 6) % 7 // Convert 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
                        return (
                          <div key={mi}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f3d2a', marginBottom: 10 }}>{m.name} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {m.dosage}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {days.map((day, di) => (
                                <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                  <div style={{ fontSize: 9, color: '#6b5e50', textTransform: 'uppercase', fontWeight: 600 }}>{day}</div>
                                  <motion.div
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => toggleTracker(selected._id, mi, di)}
                                    style={{
                                      width: 28, height: 28, borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
                                      background: di === todayIdx ? 'rgba(123, 202, 164, 0.2)' : 'transparent',
                                      border: tracker[selected._id]?.[mi]?.[di] ? 'none' : '2px solid #e8d5bc',
                                      backgroundColor: tracker[selected._id]?.[mi]?.[di] ? '#0f3d2a' : (di === todayIdx ? 'rgba(123, 202, 164, 0.2)' : 'transparent'),
                                      color: tracker[selected._id]?.[mi]?.[di] ? '#fff' : 'transparent'
                                    }}
                                  >
                                    <AnimatePresence>
                                      {tracker[selected._id]?.[mi]?.[di] && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>✓</motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* SECTION 2 — FOLLOW-UP CALENDAR */}
                  <div style={{ background: '#fff', border: '0.5px solid #e8d5bc', borderRadius: 14, padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f3d2a' }}>📅 Follow-up Appointment</div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <button onClick={() => setCalMonth(new Date(calMonth.setMonth(calMonth.getMonth() - 1)))} style={{ background: 'none', border: 'none', color: '#6b5e50', cursor: 'pointer', fontSize: 18 }}>←</button>
                        <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: '#0f3d2a', fontWeight: 600 }}>{calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                        <button onClick={() => setCalMonth(new Date(calMonth.setMonth(calMonth.getMonth() + 1)))} style={{ background: 'none', border: 'none', color: '#6b5e50', cursor: 'pointer', fontSize: 18 }}>→</button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                          <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#6b5e50', opacity: 0.5 }}>{d}</div>
                        ))}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {(() => {
                          const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
                          const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
                          
                          const slots = [];
                          for (let i = 0; i < firstDay; i++) {
                            slots.push(<div key={`p-${i}`} />);
                          }
                          for (let d = 1; d <= daysInMonth; d++) {
                            const followUpDay = selected.followUpDate ? new Date(selected.followUpDate).getDate() : -1
                            const followUpMonth = selected.followUpDate ? new Date(selected.followUpDate).getMonth() : -1
                            const followUpYear = selected.followUpDate ? new Date(selected.followUpDate).getFullYear() : -1
                            
                            const isFollowUp = d === followUpDay && calMonth.getMonth() === followUpMonth && calMonth.getFullYear() === followUpYear;
                            const isToday = d === new Date().getDate() && calMonth.getMonth() === new Date().getMonth() && calMonth.getFullYear() === new Date().getFullYear();
                            const isPast = new Date(calMonth.getFullYear(), calMonth.getMonth(), d) < new Date().setHours(0,0,0,0);
                            
                            slots.push(
                              <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    if (user.role === 'doctor') {
                                      const newDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
                                      setSelected(prev => ({ ...prev, followUpDate: newDate.toISOString() }));
                                      toast.success(`Follow-up set to ${newDate.toLocaleDateString('en-IN')}`);
                                    } else {
                                      toast('Reschedule request sent to doctor', { icon: '📅' });
                                    }
                                  }}
                                  style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    background: isFollowUp ? '#0f3d2a' : isToday ? '#7bcaa4' : 'transparent',
                                    color: (isFollowUp || isToday) ? '#fff' : isPast ? '#ccc' : '#0f3d2a',
                                  }}
                                >
                                  {d}
                                </motion.div>
                                {isFollowUp && <div style={{ fontSize: 7, color: '#0f3d2a', fontWeight: 800, marginTop: 2, textTransform: 'uppercase' }}>DR. {selected.doctorName?.split(' ')[1] || 'DOC'}</div>}
                              </div>
                            );
                          }
                          return slots;
                        })()}
                      </div>
                    </div>

                    <div style={{ background: '#EAF3DE', padding: '12px 16px', borderRadius: 12, border: '1px solid #7bcaa4', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>📅 {selected.followUpDate ? new Date(selected.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No follow-up set'} — Follow-up with {selected.doctorName || selected.doctor?.name || 'your doctor'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        onClick={() => openCalendarEvent(
                          selected.followUpDate,
                          `GramDoc Follow-up - ${selected.doctorName || selected.doctor?.name || 'Doctor'}`,
                          `GramDoc medical follow-up consultation for ${selected.patientName || 'patient'}`
                        )}
                        style={{ flex: 1, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        📲 Add to Calendar
                      </button>
                      <button
                        onClick={() => handleOrderToPharmacy(selected)}
                        style={{ flex: 1, background: '#1d9e75', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🛒 Order Medicines
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, background: '#f7f3ed', padding: '14px', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: '#6b5e50', fontWeight: 700, marginBottom: 4 }}>FOLLOW-UP</div>
                      <div style={{ fontSize: 14, color: '#0f3d2a', fontWeight: 700 }}>{selected.followUpDate ? new Date(selected.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Not scheduled'}</div>
                    </div>
                    <div style={{ flex: 1, background: user.isVerified ? '#EAF3DE' : '#f7f3ed', padding: '10px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: user.isVerified ? '1px solid #7bcaa4' : '1px solid transparent' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selected._id || selected.patientName}`} 
                        alt="Rx QR"
                        style={{ width: 44, height: 44, borderRadius: 4, mixBlendMode: 'multiply' }}
                      />
                      <div style={{ fontSize: 9, color: '#6b5e50', lineHeight: 1.2 }}>{user.isVerified ? `Verified Digital Rx\nReg: ${user.regNumber || 'N/A'}` : 'Verification\nPending'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button onClick={() => {
                      let msg = `*GramDoc Prescription*\nPatient: ${selected.patientName}\nDiagnosis: ${selected.diagnosis}\n\n*Medicines:*\n`
                      selected.medicines?.forEach(m => {
                        msg += `- ${m.name}\n  ${m.dosage} · ${m.frequency || 'Once a day'}\n  ${m.timing} · ${m.duration} ${m.durationUnit || ''}\n`
                        if (m.instructions) msg += `  Note: ${m.instructions}\n`
                      })
                      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
                      window.open(url, '_blank')
                      localStorage.removeItem('gd_active_patient')
                      localStorage.removeItem('gd_call_start')
                      localStorage.removeItem('gd_consultation_id')
                    }} style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: 'pointer' }}>📲 WhatsApp</button>
                    <button 
                      onClick={handlePrint}
                      style={{ flex: 1, background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🖨️ Print Rx
                    </button>
                  </div>

                  {/* Back to Dashboard Button */}
                  <motion.button
                    whileHover={{ background: '#EAF3DE' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBackToDashboard}
                    style={{
                      width: '100%', background: 'transparent', border: '1.5px solid #0f3d2a',
                      color: '#0f3d2a', borderRadius: 10, padding: '12px',
                      fontSize: 14, fontWeight: 600,
                      marginTop: 12, cursor: 'pointer', transition: 'background 0.2s'
                    }}
                  >
                    ← Back to Dashboard
                  </motion.button>
                </div>
              ) : prescriptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                  <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', marginBottom: 8 }}>No prescriptions yet</div>
                  <div style={{ fontSize: 12, color: '#6b5e50', maxWidth: 300, lineHeight: 1.5, marginBottom: 24 }}>
                    Your prescription history will appear here after you complete consultations
                  </div>
                  <button 
                    onClick={() => navigate('/app/consultation')}
                    style={{ background: '#0f3d2a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Start a Consultation →
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b5e50', padding: 40 }}>Select a prescription to view details</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
