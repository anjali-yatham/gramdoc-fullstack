import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

export default function Triage() {
  const nav = useNavigate()
  const [langKey, setLangKey] = useState(localStorage.getItem('gramdoc_lang') || 'en')
  const L = {
    en: {
      greet: "Namaste! 🙏 I'm GramDoc AI. I'll help connect you with the right doctor. First — can you describe how you're feeling today?",
      quick: ['I have fever', 'Cough and cold', 'Stomach pain', 'Child is sick', 'Headache', 'Pregnancy check'],
      offline: '📶 You are offline. Your symptoms will be saved and sent when internet returns.',
      fallback: 'I understand. Please share a few more details about your symptoms.',
      connectionIssue: "I'm having trouble connecting right now. Please try again or browse doctors directly.",
      summaryTitle: 'Triage Summary',
      recommended: 'recommended',
      urgency: 'Urgency',
      online: '● Online — Ready to help',
      placeholder: 'Type your symptoms here...',
      connectDoctor: 'Connect with Recommended Doctor →',
      skip: 'Skip triage — Browse doctors directly →'
    },
    hi: {
      greet: 'नमस्ते! 🙏 मैं GramDoc AI हूँ। मैं आपको सही डॉक्टर से जोड़ने में मदद करूंगा। पहले बताइए, आज आपको कैसा लग रहा है?',
      quick: ['मुझे बुखार है', 'खांसी और सर्दी', 'पेट दर्द', 'बच्चा बीमार है', 'सिर दर्द', 'गर्भावस्था जांच'],
      offline: '📶 आप ऑफ़लाइन हैं। आपके लक्षण सहेजे जाएंगे और इंटरनेट लौटने पर भेजे जाएंगे।',
      fallback: 'मैं समझ गया। कृपया अपने लक्षणों के बारे में थोड़ा और बताएं।',
      connectionIssue: 'अभी कनेक्शन में समस्या है। कृपया फिर से कोशिश करें या सीधे डॉक्टर देखें।',
      summaryTitle: 'ट्रायेज सारांश',
      recommended: 'सुझाया गया',
      urgency: 'तात्कालिकता',
      online: '● ऑनलाइन — सहायता के लिए तैयार',
      placeholder: 'अपने लक्षण यहां लिखें...',
      connectDoctor: 'सुझाए गए डॉक्टर से जुड़ें →',
      skip: 'ट्रायेज छोड़ें — सीधे डॉक्टर देखें →'
    },
    te: {
      greet: 'నమస్కారం! 🙏 నేను GramDoc AI. మీకు సరైన డాక్టర్‌ను కనెక్ట్ చేయడంలో సహాయం చేస్తాను. ముందు, ఈరోజు మీకు ఎలా అనిపిస్తుందో చెప్పండి?',
      quick: ['నాకు జ్వరం ఉంది', 'దగ్గు మరియు జలుబు', 'కడుపు నొప్పి', 'పిల్లవాడు అనారోగ్యం', 'తలనొప్పి', 'గర్భధారణ తనిఖీ'],
      offline: '📶 మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. మీ లక్షణాలు సేవ్ చేయబడతాయి, ఇంటర్నెట్ వచ్చినప్పుడు పంపబడతాయి.',
      fallback: 'నాకు అర్థమైంది. దయచేసి మీ లక్షణాల గురించి ఇంకొంచెం చెప్పండి.',
      connectionIssue: 'ఇప్పుడు కనెక్షన్ సమస్య ఉంది. మళ్లీ ప్రయత్నించండి లేదా నేరుగా డాక్టర్లను చూడండి.',
      summaryTitle: 'ట్రయాజ్ సారాంశం',
      recommended: 'సిఫారసు చేయబడింది',
      urgency: 'అత్యవసరం',
      online: '● ఆన్‌లైన్ — సహాయం కోసం సిద్ధంగా ఉంది',
      placeholder: 'మీ లక్షణాలు ఇక్కడ టైప్ చేయండి...',
      connectDoctor: 'సిఫారసు చేసిన డాక్టర్‌తో కనెక్ట్ అవ్వండి →',
      skip: 'ట్రయాజ్ దాటవేయండి — నేరుగా డాక్టర్లను చూడండి →'
    }
  }[langKey] || {}

  const QUICK = L.quick || ['I have fever', 'Cough and cold', 'Stomach pain', 'Child is sick', 'Headache', 'Pregnancy check']
  const [msgs, setMsgs] = useState([{ role:'bot', text: L.greet || "Namaste! 🙏 I'm GramDoc AI. I'll help connect you with the right doctor. First — can you describe how you're feeling today?" }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [summary, setSummary] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const bottom = useRef(null)
  const langLabel = langKey === 'hi' ? 'हिं' : langKey === 'te' ? 'తె' : 'EN'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(()=>{ bottom.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, typing])

  useEffect(() => {
    const greet = L.greet || "Namaste! 🙏 I'm GramDoc AI. I'll help connect you with the right doctor. First — can you describe how you're feeling today?"
    setMsgs(current => {
      if (current.length !== 1 || current[0]?.role !== 'bot') return current
      if (current[0].text === greet) return current
      return [{ role: 'bot', text: greet }]
    })
  }, [langKey])

  useEffect(() => {
    const syncLang = () => setLangKey(localStorage.getItem('gramdoc_lang') || 'en')
    window.addEventListener('languageChange', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('languageChange', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  async function send(text) {
    if (!text.trim()) return
    const userMsg = { role:'user', text }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs); setInput(''); setTyping(true)
    
    if (!navigator.onLine) {
      const offlineSymptom = {
        symptoms: text,
        timestamp: Date.now(),
        patientId: api.getUser()?.id || 'guest',
        synced: false
      }
      const existing = JSON.parse(localStorage.getItem('gd_offline_symptoms') || '[]')
      localStorage.setItem('gd_offline_symptoms', JSON.stringify([...existing, offlineSymptom]))
      
      setMsgs(m => [...m, { role: 'bot', text: L.offline }])
      setTyping(false)
      return
    }

    const langName = langKey === 'te' ? 'Telugu' : langKey === 'hi' ? 'Hindi' : 'English'
    const SYSTEM_PROMPT = `You are GramDoc AI, a smart medical triage assistant for rural patients in India.
You speak like a warm, caring village doctor.
ALWAYS respond in ${langName} only.
Keep every response under 20 words.
Ask ONE relevant question per turn.

YOUR BEHAVIOUR:
- Listen to what the patient says.
- Ask follow-up questions RELEVANT to their specific complaint.
- ALWAYS check for associated symptoms (e.g., if fever, ask about cough, cold, vomiting, or body ache).
- NEVER ask generic questions like "How do you feel?" or "Tell me more" without a clinical focus.
- Adapt your questions based on what patient tells you.

EXAMPLES OF CONTEXTUAL QUESTIONING:

If patient says "pregnancy":
  Ask: How many months pregnant?
  Ask: What problem are you feeling?
  Ask: Is there pain or bleeding?
  → Take very seriously, likely MEDIUM or HIGH

If patient says "joint or back pain":
  Ask: Which part of your body hurts?
  Ask: Did the pain start after an injury or lifting weight?
  Ask: Is there any swelling or redness?
  Ask: Does the pain make it hard to move or walk?

If patient says "burning urine or toilet problem":
  Ask: Is there pain or burning while passing urine?
  Ask: How many times do you go to the toilet in a day?
  Ask: Is there any blood or change in urine color?
  Ask: Do you also have fever or back pain?

If patient says "weakness or dizziness":
  Ask: Do you feel like fainting when you stand up?
  Ask: Are you eating and drinking properly?
  Ask: Do you look pale or feel very tired all the time?
  Ask: Any history of sugar or blood pressure?

If patient says "eye problem":
  Ask: How long has your eye been red/painful?
  Ask: Is there discharge from eye?
  Ask: Is your vision affected?
  Ask: Did anything fall into your eye?

If patient says "stomach pain":
  Ask: Where exactly is the pain? Upper or lower stomach?
  Ask: How long have you had this pain?
  Ask: Any vomiting or loose motions?
  Ask: Did you eat something different recently?

If patient says "chest pain":
  Ask: Is pain constant or comes and goes?
  Ask: Does pain spread to arm or jaw?
  Ask: Do you feel breathless?
  → This is HIGH urgency, advise immediate care after minimum 3 questions

If patient says "fever":
  Ask: How many days have you had fever?
  Ask: Do you also have cold, cough, or vomiting?
  Ask: Any chills or severe body ache?
  Ask: Is the fever continuous or coming and goes?

RULES:
1. Minimum 3 questions maximum 6 questions before diagnosis
2. If symptoms sound like emergency (chest pain, breathing trouble, unconscious, severe bleeding) classify HIGH and advise immediate care
3. Be conversational not robotic
4. Remember what patient said earlier in conversation
5. Never repeat a question already asked

After sufficient questions (minimum 3) output on its own line:
TRIAGE_COMPLETE: {"urgency":"HIGH/MEDIUM/LOW","symptoms":"patient's specific symptoms","doctor":"most relevant specialist","summary":"brief reassuring summary in ${langName}","duration":"how long patient has had problem","severity":"mild/moderate/severe","keyFindings":"2-3 important clinical points from conversation"}`

    try {
      const messagesForAi = [
        { role: 'system', text: SYSTEM_PROMPT },
        ...newMsgs.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }))
      ]
      const res = await api.triageChat(messagesForAi)
      const reply = (res.reply || '').trim() || L.fallback
      
      // Clean up reply if it contains the TRIAGE_COMPLETE JSON
      const displayReply = reply.split('TRIAGE_COMPLETE:')[0].trim() || reply
      
      setMsgs(m => [...m, { role: 'bot', text: displayReply }])
      if (res.urgency || res.specialist) {
        setSummary({ urgency: res.urgency, specialist: res.specialist })
      }
    } catch (err) {
      setMsgs(m => [...m, { role: 'bot', text: L.connectionIssue }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div style={{ maxWidth:680, margin:'0 auto', height:'calc(100vh - 120px)', display:'flex', flexDirection:'column' }}>
      {/* Offline Banner */}
      {!isOnline && (
        <div style={{ 
          background: '#FEF3C7', border: '1px solid #F59E0B', 
          padding: '10px 16px', borderRadius: 12, color: '#92400E', 
          fontSize: '12px', fontWeight: 600, marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span>📶</span>
          {L.offline.replace('📶 ', '')}
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', marginBottom:14, border:'0.5px solid var(--sandstone)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--forest)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
          <div><div style={{ fontSize:13, fontWeight:700, color:'var(--forest)' }}>GramDoc AI</div><div style={{ fontSize:10, color:'var(--success)' }}>{L.online}</div></div>
        </div>
        <div style={{ display:'flex', background:'var(--sand)', borderRadius:20, padding:2, gap:1 }}>
          {['EN','हिं','తె'].map(l=>(
            <button key={l} onClick={() => {
              const nextLang = l === 'हिं' ? 'hi' : l === 'తె' ? 'te' : 'en'
              setLangKey(nextLang)
              localStorage.setItem('gramdoc_lang', nextLang)
              window.dispatchEvent(new Event('languageChange'))
            }} style={{ fontSize:10, fontWeight:600, padding:'4px 9px', borderRadius:16, border:'none', cursor:'pointer', background:langLabel===l?'var(--forest)':'transparent', color:langLabel===l?'#fff':'var(--warm-gray)' }}>{l}</button>
          ))}
        </div>
      </div>

      {summary && (
        <div style={{ background:'#EAF3DE', border:'1px solid #b5dcca', borderRadius:12, padding:'12px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B6D11', textTransform:'uppercase' }}>{L.summaryTitle}</div>
            <div style={{ fontSize:13, color:'var(--forest)', fontWeight:600 }}>{summary.specialist || 'General Physician'} {L.recommended}</div>
          </div>
          <div style={{ background: summary.urgency === 'High' ? '#fee2e2' : '#fef3c7', color: summary.urgency === 'High' ? '#991b1b' : '#92400e', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
            {L.urgency}: {summary.urgency || 'Normal'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:12 }}>
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', marginBottom:10 }}>
            {m.role==='bot'&&<div style={{ width:28, height:28, borderRadius:'50%', background:'var(--forest)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🤖</div>}
            <div style={{ maxWidth:'72%', background:m.role==='user'?'var(--forest)':'#fff', color:m.role==='user'?'#fff':'var(--warm-dark)', borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'10px 14px', fontSize:13, lineHeight:1.6, border:m.role==='bot'?'0.5px solid var(--sandstone)':undefined, boxShadow:'var(--shadow-sm)' }}>
              {m.text}
            </div>
          </div>
        ))}
        {typing&&<div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',background:'var(--forest)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>🤖</div>
          <div style={{ background:'#fff', border:'0.5px solid var(--sandstone)', borderRadius:'18px 18px 18px 4px', padding:'10px 14px' }}>
            <div style={{ display:'flex',gap:4 }}>{[0,1,2].map(i=><span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--sandstone)',display:'inline-block',animation:`bounce 1s ${i*0.2}s infinite` }}>●</span>)}</div>
          </div>
        </div>}
        <div ref={bottom}/>
      </div>

      {/* Quick replies */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        {QUICK.map(q=>(
          <button key={q} onClick={()=>send(q)} style={{ background:'#fff', border:'0.5px solid var(--sandstone)', borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:500, color:'var(--forest)', cursor:'pointer' }}>{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:8, background:'#fff', borderRadius:14, border:'0.5px solid var(--sandstone)', padding:'8px 8px 8px 16px', alignItems:'center' }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)}
          placeholder={L.placeholder} style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'var(--warm-dark)', background:'transparent' }} />
        <button onClick={()=>send(input)} style={{ background:'var(--forest)', color:'#fff', border:'none', borderRadius:10, width:38, height:38, fontSize:16, cursor:'pointer', flexShrink:0 }}>→</button>
      </div>
      <button onClick={()=>nav('/app/doctors')} style={{ marginTop:10, background:'var(--mint-pale)', color:'#3B6D11', border:'none', borderRadius:10, padding:'10px', fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'center' }}>
        {summary ? L.connectDoctor : L.skip}
      </button>
    </div>
  )
}
