import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { getMatchingSpecs } from '../utils/healthConstants'
import { LANGS } from '../utils/translations'

const SPECS = ['All','General Physician','Pediatrician','Gynaecologist','Cardiologist','Dermatologist']

export default function Doctors() {
  const nav = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [spec, setSpec] = useState('All')
  const [loading, setLoading] = useState(true)
  const [queueRequesting, setQueueRequesting] = useState(false)
  const [recommendedSpec, setRecommendedSpec] = useState(localStorage.getItem('gd_recommended_specialist'))
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentDoctor, setPaymentDoctor] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [showBplInput, setShowBplInput] = useState(false)
  const [bplNumber, setBplNumber] = useState('')
  const lang = localStorage.getItem('gramdoc_lang') || 'en'
  const t = LANGS[lang]?.ui || LANGS.en.ui
  const TX = {
    loadFail: { en: 'Failed to load doctors', hi: 'डॉक्टर लोड करने में समस्या हुई', te: 'డాక్టర్లను లోడ్ చేయలేకపోయాము' },
    loading: { en: 'Loading doctors...', hi: 'डॉक्टर लोड हो रहे हैं...', te: 'డాక్టర్లు లోడ్ అవుతున్నారు...' },
    aiRecommends: { en: 'GramDoc AI recommends a', hi: 'GramDoc AI सुझाव देता है', te: 'GramDoc AI సిఫారసు చేస్తోంది' },
    showAll: { en: 'Show all doctors', hi: 'सभी डॉक्टर दिखाएं', te: 'అన్ని డాక్టర్లను చూపించు' },
    noSpec: { en: 'available right now', hi: 'अभी उपलब्ध नहीं है', te: 'ప్రస్తుతం అందుబాటులో లేదు' },
    basedOn: { en: 'Based on your symptoms our AI suggests you need a', hi: 'आपके लक्षणों के आधार पर AI कहता है कि आपको चाहिए', te: 'మీ లక్షణాల ఆధారంగా AI సూచన' },
    currentlyNone: { en: 'Currently none are available on GramDoc.', hi: 'फिलहाल GramDoc पर उपलब्ध नहीं हैं।', te: 'ప్రస్తుతం GramDoc లో అందుబాటులో లేరు.' },
    consultGp: { en: 'Consult General Physician instead', hi: 'इसके बजाय जनरल फिजिशियन से सलाह लें', te: 'బదులుగా జనరల్ ఫిజిషియన్‌ను సంప్రదించండి' },
    findNearby: { en: 'Find specialist hospital nearby', hi: 'पास का विशेषज्ञ अस्पताल खोजें', te: 'సమీప నిపుణుల ఆసుపత్రి కనుగొనండి' },
    allOffline: { en: 'are currently offline', hi: 'वर्तमान में ऑफलाइन हैं', te: 'ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు' },
    estimated: { en: 'Estimated availability: Within 2 hours. You can wait or consult a General Physician now.', hi: 'अनुमानित उपलब्धता: 2 घंटे में। आप प्रतीक्षा कर सकते हैं या अभी जनरल फिजिशियन से बात कर सकते हैं।', te: 'అంచనా అందుబాటు: 2 గంటల్లో. మీరు వేచి ఉండవచ్చు లేదా ఇప్పుడే జనరల్ ఫిజిషియన్‌ను కలవండి.' },
    wait: { en: 'Wait for Specialist', hi: 'विशेषज्ञ के लिए प्रतीक्षा करें', te: 'నిపుణుడి కోసం వేచి ఉండండి' },
    gpNow: { en: 'Consult GP Now', hi: 'अभी GP से सलाह लें', te: 'ఇప్పుడే GP ను సంప్రదించండి' },
    recommended: { en: 'Recommended for you', hi: 'आपके लिए सुझाव', te: 'మీ కోసం సిఫారసు' },
    different: { en: 'Different specialty', hi: 'अलग विशेषज्ञता', te: 'వేరే నైపుణ్యం' },
    waitTime: { en: 'Wait time', hi: 'प्रतीक्षा समय', te: 'వేచి సమయం' },
    fee: { en: 'Consultation fee', hi: 'परामर्श शुल्क', te: 'సంప్రదింపు ఫీజు' },
    perConsult: { en: '₹49 per consult', hi: '₹49 प्रति परामर्श', te: 'ప్రతి సంప్రదింపుకు ₹49' },
    availableToday: { en: 'Available: 9AM - 6PM today', hi: 'उपलब्ध: आज 9AM - 6PM', te: 'అందుబాటులో: ఈరోజు 9AM - 6PM' },
    book: { en: 'Consult Now', hi: 'अभी परामर्श करें', te: 'ఇప్పుడే సంప్రదించండి' },
    noMatch: { en: 'No doctors match your filter.', hi: 'कोई डॉक्टर इस फ़िल्टर से मेल नहीं खाता।', te: 'ఈ ఫిల్టర్‌కు సరిపోయే డాక్టర్లు లేరు.' },
    backAll: { en: '← Back to all doctors', hi: '← सभी डॉक्टरों पर वापस जाएं', te: '← అన్ని డాక్టర్లకు తిరిగి వెళ్లండి' }
  }

  useEffect(() => {
    // Refresh recommended spec if localStorage changes
    const check = () => {
      const spec = localStorage.getItem('gd_recommended_specialist')
      if (spec !== recommendedSpec) setRecommendedSpec(spec)
    }
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [recommendedSpec])

  useEffect(()=>{
    setLoading(true)
    api.getDoctors().then(d => {
      setDoctors(d)
    }).catch(err => {
      toast.error(TX.loadFail[lang] || TX.loadFail.en)
    }).finally(() => {
      setLoading(false)
    })
  },[])

  const handleBook = (doctor) => {
    setPaymentDoctor(doctor)
    setShowPayment(true)
    setPaymentStatus(null)
    setShowBplInput(false)
    setBplNumber('')
  }

  const handlePaymentClick = (method) => {
    setPaymentStatus('processing')
    setTimeout(() => {
      setPaymentStatus('success')
      toast.success('Payment successful! ₹49')
      setTimeout(() => {
        localStorage.setItem('gd_doctor', JSON.stringify(paymentDoctor))
        nav('/app/consultation', { state: { doctor: paymentDoctor, paid: true } })
        setShowPayment(false)
        setPaymentStatus(null)
      }, 1500)
    }, 2000)
  }

  const handleWaitForSpecialist = () => {
    if (!recommendedSpec) return
    setQueueRequesting(true)
    const req = {
      requestedSpecialist: recommendedSpec,
      requestedAt: new Date().toISOString(),
      status: 'waiting'
    }
    localStorage.setItem('gd_specialist_wait_request', JSON.stringify(req))
    setTimeout(() => {
      setQueueRequesting(false)
      toast.success('You are on the specialist waitlist. We will notify you.')
    }, 500)
  }

  const clearFilter = () => {
    localStorage.removeItem('gd_recommended_specialist')
    setRecommendedSpec(null)
    setSpec('All')
  }

  const matchingSpecs = getMatchingSpecs(recommendedSpec)
  const effectiveRecommendedSpec = matchingSpecs.length > 0 ? matchingSpecs[0] : null
  
  // Sort logic: matching specialists at top, then matching general physicians, then others
  const sortedDoctors = [...doctors].sort((a, b) => {
    if (!effectiveRecommendedSpec) return 0
    const aMatch = matchingSpecs.some(s => a.specialization?.toLowerCase().includes(s.toLowerCase()))
    const bMatch = matchingSpecs.some(s => b.specialization?.toLowerCase().includes(s.toLowerCase()))
    if (aMatch && !bMatch) return -1
    if (!aMatch && bMatch) return 1
    return 0
  })

  const filtered = sortedDoctors.filter(d => {
    const matchesSpec = spec === 'All' || d.specialization === spec
    const matchesAvailability = !availableOnly || d.isAvailable === true
    return matchesSpec && matchesAvailability
  })
  
  const matchingInList = doctors.filter(d => 
    effectiveRecommendedSpec && matchingSpecs.some(s => d.specialization?.toLowerCase().includes(s.toLowerCase()))
  )

  const allMatchingOffline = matchingInList.length > 0 && matchingInList.every(d => d.isAvailable === false)

  const initials = name => name.split(' ').filter((_,i)=>i>0).map(n=>n[0]).join('').slice(0,2)
  const colors = ['#0f3d2a','#c4653a','#1d9e75','#ba7517','#2d5fa3','#7b3fa0']
  const COLORS = { forest: '#0f3d2a', mint: '#7bcaa4', mintLight: '#EAF3DE', warmGray: '#6b5e50', amber: '#FAEEDA', amberDark: '#854F0B' }

  if (loading) return <div style={{ textAlign:'center', padding:40 }}>{TX.loading[lang] || TX.loading.en}</div>

  return (
    <div style={{ maxWidth:960, margin:'0 auto', paddingBottom: 40 }}>
      {/* RECOMMENDATION BANNER */}
      {effectiveRecommendedSpec && matchingInList.length > 0 && !allMatchingOffline && (
        <div style={{ 
          background: COLORS.mintLight, 
          border: `1px solid ${COLORS.mint}`, 
          borderRadius: 12, 
          padding: '12px 16px', 
          marginBottom: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <span style={{ color: COLORS.forest, fontSize: 13, fontWeight: 600 }}>
              {TX.aiRecommends[lang] || TX.aiRecommends.en} {effectiveRecommendedSpec}
            </span>
          </div>
          <span onClick={clearFilter} style={{ color: COLORS.warmGray, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            {TX.showAll[lang] || TX.showAll.en}
          </span>
        </div>
      )}

      {/* NO SPECIALIST AVAILABLE CARD */}
      {effectiveRecommendedSpec && matchingInList.length === 0 && (
        <div style={{ 
          background: COLORS.amber, 
          border: `1px solid ${COLORS.amberDark}`, 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 20 
        }}>
          <div style={{ color: COLORS.forest, fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠️ No {effectiveRecommendedSpec} {TX.noSpec[lang] || TX.noSpec.en}
          </div>
          <div style={{ color: COLORS.warmGray, fontSize: 12, marginBottom: 12 }}>
            {TX.basedOn[lang] || TX.basedOn.en} {effectiveRecommendedSpec}. {TX.currentlyNone[lang] || TX.currentlyNone.en}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => { setSpec('General Physician'); setRecommendedSpec(null); }}
              style={{ background: COLORS.mint, color: COLORS.forest, border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {TX.consultGp[lang] || TX.consultGp.en}
            </button>
            <button 
              onClick={() => window.open('https://www.google.com/maps/search/' + recommendedSpec + '+near+me')}
              style={{ background: 'transparent', color: COLORS.forest, border: `1px solid ${COLORS.forest}`, borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {TX.findNearby[lang] || TX.findNearby.en}
            </button>
          </div>
        </div>
      )}

      {/* ALL SPECIALISTS OFFLINE BANNER */}
      {effectiveRecommendedSpec && allMatchingOffline && (
        <div style={{ background: COLORS.amber, border: `1px solid ${COLORS.amberDark}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ color: COLORS.forest, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>All {effectiveRecommendedSpec}s {TX.allOffline[lang] || TX.allOffline.en}</div>
          <div style={{ color: COLORS.warmGray, fontSize: 12, marginBottom: 8 }}>{TX.estimated[lang] || TX.estimated.en}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleWaitForSpecialist} disabled={queueRequesting} style={{ background: COLORS.forest, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: queueRequesting ? 0.6 : 1 }}>{TX.wait[lang] || TX.wait.en}</button>
            <button onClick={() => { setSpec('General Physician'); setRecommendedSpec(null); }} style={{ background: COLORS.mint, color: COLORS.forest, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{TX.gpNow[lang] || TX.gpNow.en}</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:1, display:'flex', gap:8, flexWrap:'wrap' }}>
          {SPECS.map(s=>(
            <button key={s} onClick={()=>setSpec(s)} style={{ fontSize:13, fontWeight:600, padding:'8px 16px', borderRadius:20, border:`1px solid ${spec===s?'#0f3d2a':'#e8d5bc'}`, background:spec===s?'#0f3d2a':'#fff', color:spec===s?'#fff':'#6b5e50', cursor:'pointer', transition: 'all 0.2s' }}>{s}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:12, color:'#6b5e50', fontWeight:600, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <div
              onClick={() => setAvailableOnly(v => !v)}
              style={{
                width: 38,
                height: 22,
                borderRadius: 999,
                background: availableOnly ? '#1d9e75' : '#ded6ca',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: availableOnly ? 'flex-end' : 'flex-start',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
            </div>
            Show available only
          </label>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))', gap:20 }}>
        {filtered.map((d,i)=>{
          const isMatch = effectiveRecommendedSpec && matchingSpecs.some(s => d.specialization?.toLowerCase().includes(s.toLowerCase()))
          const opacity = effectiveRecommendedSpec && !isMatch ? 0.5 : 1
          
          return (
            <div key={d._id} style={{ 
              background:'#fff', 
              borderRadius:20, 
              padding:'24px', 
              border: isMatch ? `2px solid ${COLORS.mint}` : '0.5px solid #e8d5bc', 
              borderLeft: isMatch ? `4px solid ${COLORS.mint}` : '0.5px solid #e8d5bc',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              opacity,
              transition: 'all 0.3s ease',
              position: 'relative'
            }}>
              {isMatch && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: COLORS.mintLight, color: COLORS.forest, fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLORS.mint}` }}>
                  ✓ {TX.recommended[lang] || TX.recommended.en}
                </div>
              )}

              <div style={{ position: 'absolute', top: isMatch ? 36 : 12, right: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.isAvailable ? '#1d9e75' : '#999' }} />
                <span style={{ fontSize: 10, color: d.isAvailable ? '#1d9e75' : '#999', fontWeight: 700 }}>
                  {d.isAvailable ? 'Available Now' : 'Unavailable'}
                </span>
              </div>
              
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:colors[i%colors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0 }}>{initials(d.name)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize:13, color:'#6b5e50', marginTop:2 }}>{d.specialization}</div>
                  {d.experience && <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{d.experience} years experience</div>}
                  {!isMatch && effectiveRecommendedSpec && <div style={{ fontSize: 10, color: COLORS.warmGray, fontWeight: 600, marginTop: 4 }}>{TX.different[lang] || TX.different.en}</div>}
                  {typeof d.rating === 'number' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>⭐ {d.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(d.languages || ['English', 'Hindi', 'Telugu']).map(l=><span key={l} style={{ background:'#fdf6ec', color:'#6b5e50', fontSize:11, padding:'4px 10px', borderRadius:12 }}>{l}</span>)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 12 }}>
                 <div>
                   <div style={{ fontSize: 11, color: '#6b5e50' }}>{TX.waitTime[lang] || TX.waitTime.en}</div>
                   <div style={{ fontSize: 16, color: '#7bcaa4', fontWeight: 700 }}>{d.estimatedWait || 'N/A'}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: 11, color: '#6b5e50' }}>{TX.fee[lang] || TX.fee.en}</div>
                   <div style={{ fontSize: 12, color: '#6b5e50', fontWeight: 600 }}>₹49 per consult</div>
                 </div>
              </div>

              {d.availabilityText && (
                <div style={{ fontSize: 11, color: '#7bcaa4', fontWeight: 600 }}>{d.availabilityText}</div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBook(d)}
                style={{ width: '100%', background: '#0f3d2a', color: '#fff', borderRadius: 12, padding: '14px', fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, border: 'none', cursor: 'pointer', marginTop: 'auto' }}
              >
                {TX.book[lang] || TX.book.en}
              </motion.button>
            </div>
          )
        })}
      </div>
      {filtered.length===0&&<div style={{ textAlign:'center', padding:'60px 20px', color:'#6b5e50' }}>{TX.noMatch[lang] || TX.noMatch.en}</div>}
      
      {effectiveRecommendedSpec && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span onClick={clearFilter} style={{ fontSize: 13, color: COLORS.forest, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            {TX.backAll[lang] || TX.backAll.en}
          </span>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && paymentDoctor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, display: 'flex', alignItems: 'flex-end', padding: 0 }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div></div>
              <button onClick={() => setShowPayment(false)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: COLORS.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>
                {paymentDoctor.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#0f3d2a', fontWeight: 700 }}>{paymentDoctor.name}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{paymentDoctor.specialization}</div>
            </div>

            <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: 14, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Consultation Fee</div>
              <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 32, color: '#0f3d2a', fontWeight: 700 }}>₹49</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                <span onClick={() => setShowBplInput(true)} style={{ color: '#1d9e75', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Free for BPL card holders</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 12 }}>Payment Options</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <button onClick={() => handlePaymentClick('gpay')} disabled={paymentStatus === 'processing'} style={{ border: '1px solid #e8d5bc', background: paymentStatus === 'processing' ? '#f5f5f5' : '#fff', borderRadius: 10, padding: 12, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0f3d2a', transition: 'all 0.2s', opacity: paymentStatus === 'processing' ? 0.6 : 1 }}>
                  🟢 GPay
                </button>
                <button onClick={() => handlePaymentClick('phonepe')} disabled={paymentStatus === 'processing'} style={{ border: '1px solid #e8d5bc', background: paymentStatus === 'processing' ? '#f5f5f5' : '#fff', borderRadius: 10, padding: 12, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0f3d2a', transition: 'all 0.2s', opacity: paymentStatus === 'processing' ? 0.6 : 1 }}>
                  📱 PhonePe
                </button>
                <button onClick={() => handlePaymentClick('paytm')} disabled={paymentStatus === 'processing'} style={{ border: '1px solid #e8d5bc', background: paymentStatus === 'processing' ? '#f5f5f5' : '#fff', borderRadius: 10, padding: 12, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0f3d2a', transition: 'all 0.2s', opacity: paymentStatus === 'processing' ? 0.6 : 1 }}>
                  💙 Paytm
                </button>
                <button onClick={() => handlePaymentClick('upi')} disabled={paymentStatus === 'processing'} style={{ border: '1px solid #e8d5bc', background: paymentStatus === 'processing' ? '#f5f5f5' : '#fff', borderRadius: 10, padding: 12, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0f3d2a', transition: 'all 0.2s', opacity: paymentStatus === 'processing' ? 0.6 : 1 }}>
                  🏦 UPI
                </button>
              </div>
            </div>

            {paymentStatus === 'processing' && (
              <div style={{ textAlign: 'center', padding: '20px', marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, border: '3px solid #d8e7df', borderTop: '3px solid #0f3d2a', borderRadius: '50%', margin: '0 auto 12px', animation: 'spinPay 0.9s linear infinite' }} />
                <div style={{ fontSize: 13, color: '#0f3d2a', fontWeight: 600 }}>Processing payment...</div>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px', marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 13, color: '#1d9e75', fontWeight: 600 }}>Payment Successful!</div>
              </div>
            )}

            {showBplInput && (
              <div style={{ border: '1px solid #e8d5bc', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#6b5e50', marginBottom: 8 }}>Enter BPL card number</div>
                <input
                  value={bplNumber}
                  onChange={(e) => setBplNumber(e.target.value)}
                  placeholder="BPL card number"
                  style={{ width: '100%', border: '1px solid #e8d5bc', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}
                />
                <button
                  onClick={() => {
                    if (!bplNumber.trim()) {
                      toast.error('Please enter BPL number')
                      return
                    }
                    toast.success('BPL verified. Continuing free consultation.')
                    localStorage.setItem('gd_doctor', JSON.stringify(paymentDoctor))
                    nav('/app/consultation', { state: { doctor: paymentDoctor, paid: true, bpl: true } })
                    setShowPayment(false)
                  }}
                  style={{ width: '100%', background: '#1d9e75', color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Continue Free
                </button>
              </div>
            )}

            <button
              onClick={() => handlePaymentClick('direct')}
              disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
              style={{ width: '100%', background: '#0f3d2a', color: '#fff', borderRadius: 12, padding: 14, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 10, opacity: paymentStatus === 'processing' ? 0.6 : 1 }}
            >
              Pay ₹49
            </button>

            <button onClick={() => {
              setShowPayment(false)
              setPaymentStatus(null)
              setShowBplInput(v => !v)
            }} disabled={paymentStatus === 'processing'} style={{ width: '100%', background: 'transparent', color: '#0f3d2a', borderRadius: 10, padding: 10, fontSize: 12, border: '1px solid #0f3d2a', cursor: 'pointer', marginBottom: 10, opacity: paymentStatus === 'processing' ? 0.6 : 1 }}>
              I have BPL card
            </button>

            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }

              @keyframes spinPay {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  )
}
