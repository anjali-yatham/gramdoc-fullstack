import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/api'
import { extractSymptoms, analyzeSymptomsML, getMLUrgency } from '../utils/symptomML'
import toast from 'react-hot-toast'
import { getLangCode } from '../utils/translations'

const voiceState = {
  voices: [],
  loaded: false,
  warnedForLang: null
}

const getVoiceMode = () => localStorage.getItem('gd_tts_mode') || 'native'

const ensureVoicesLoaded = () => new Promise((resolve) => {
  const synth = window.speechSynthesis
  const tryLoad = () => {
    const list = synth.getVoices()
    if (list && list.length > 0) {
      voiceState.voices = list
      voiceState.loaded = true
      resolve(list)
      return true
    }
    return false
  }
  if (tryLoad()) return
  const handler = () => {
    if (tryLoad()) synth.removeEventListener('voiceschanged', handler)
  }
  synth.addEventListener('voiceschanged', handler)
  setTimeout(() => {
    tryLoad()
    resolve(voiceState.voices)
  }, 1200)
})

const pickVoice = (lang, voiceMode = 'native') => {
  const voices = voiceState.voices || []
  if (voices.length === 0) return null

  if (voiceMode === 'english_fallback') {
    const indiaEnglish = voices.find(v => (v.lang || '').toLowerCase().startsWith('en-in'))
    const english = voices.find(v => (v.lang || '').toLowerCase().startsWith('en'))
    return indiaEnglish || english || voices[0]
  }

  const langCode = { en: 'en', hi: 'hi', te: 'te' }[lang] || 'en'
  const countryCode = { en: 'in', hi: 'in', te: 'in' }[lang] || 'in'

  const exact = voices.find(v => (v.lang || '').toLowerCase().startsWith(`${langCode}-${countryCode}`))
  if (exact) return exact

  const languageOnly = voices.find(v => (v.lang || '').toLowerCase().startsWith(langCode))
  if (languageOnly) return languageOnly

  const indiaEnglish = voices.find(v => (v.lang || '').toLowerCase().startsWith('en-in'))
  return indiaEnglish || voices[0]
}

const speak = (text, onEnd) => {
  const selectedLang = localStorage.getItem('gramdoc_lang') || 'en'
  const voiceMode = getVoiceMode()
  const minReadMs = Math.min(9000, Math.max(3200, text.length * 70))
  window.speechSynthesis.cancel()

  ensureVoicesLoaded().finally(() => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voiceMode === 'english_fallback' ? 'en-IN' : getLangCode()
    const selectedVoice = pickVoice(selectedLang, voiceMode)
    if (selectedVoice) u.voice = selectedVoice

    if (!selectedVoice && voiceState.warnedForLang !== `${selectedLang}:${voiceMode}`) {
      voiceState.warnedForLang = `${selectedLang}:${voiceMode}`
      const message = voiceMode === 'english_fallback'
        ? 'English fallback voice not found in browser; using available voice.'
        : 'Native voice not found in browser; using fallback voice.'
      toast(message, { icon: '🔊' })
    }

    u.rate = selectedLang === 'te' ? 0.8 : 0.85
    u.pitch = 1.0
    u.volume = 1.0
    const startedAt = Date.now()
    let called = false
    const done = () => {
      if (called) return
      called = true
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, minReadMs - elapsed)
      setTimeout(() => onEnd?.(), remaining)
    }
    u.onend = done
    u.onerror = done
    window.speechSynthesis.speak(u)
    setTimeout(() => { if (!window.speechSynthesis.speaking) done() }, 14000)
  })
}

const stopSpeaking = () => window.speechSynthesis.cancel()

const T = {
  idle: { en: "Tap to tell us your problem", hi: "अपनी समस्या बताने के लिए दबाएं", te: "మీ సమస్య చెప్పడానికి నొక్కండి" },
  idleSub: { en: "Speak in Telugu, Hindi, or English", hi: "अपनी भाषा में बोलें - तेलुगु, हिंदी, अंग्रेज़ी", te: "మీ భాషలో మాట్లాడండి - తెలుగు, హిందీ, ఇంగ్లీష్" },
  speakBtn: { en: "🎙️ Speak Now", hi: "🎙️ बोलिए", te: "🎙️ మాట్లాడండి" },
  listening: { en: "Listening...", hi: "सुन रहे हैं...", te: "వింటున్నాము..." },
  placeholder: { en: "Start speaking...", hi: "बोलना शुरू करें...", te: "మీరు మాట్లాడటం ప్రారంభించండి..." },
  stopBtn: { en: "Tap to stop", hi: "रोकने के लिए दबाएं", te: "ఆపడానికి నొక్కండి" },
  processing: { en: "Analyzing your information...", hi: "जानकारी का विश्लेषण हो रहा है...", te: "మీ సమాచారం విశ్లేషిస్తున్నాను..." },
  speaking: { en: "🔊 Speaking...", hi: "🔊 बोल रहा हूं...", te: "🔊 మాట్లాడుతున్నాను..." },
  greet: {
    en: 'Namaste! I am GramDoc AI. What problem are you facing? Please tell me.',
    hi: 'नमस्ते! मैं GramDoc AI हूं। आपको क्या तकलीफ है? बताइए।',
    te: 'నమస్కారం! నేను GramDoc AI ని. మీకు ఏమి అయింది? మీ సమస్య చెప్పండి.'
  },
  langBadge: { en: 'EN', hi: 'हि', te: 'తె' }
}

const FALLBACK_QUESTIONS = {
  fever: {
    en: 'How many days have you had fever?',
    hi: 'बुखार कितने दिनों से है?',
    te: 'జ్వరం ఎంత రోజులుగా ఉంది?'
  },
  headache: {
    en: 'Is the headache severe or mild?',
    hi: 'सिरदर्द तेज है या हल्का?',
    te: 'తలనొప్పి ఎక్కువగా ఉందా లేదా తేలికగా ఉందా?'
  },
  cough: {
    en: 'Is it a dry cough or with phlegm?',
    hi: 'खांसी सूखी है या बलगम वाली?',
    te: 'దగ్గు పొడి దా లేక కఫం ఉందా?'
  },
  cold: {
    en: 'Do you also have sneezing or runny nose?',
    hi: 'क्या छींक या नाक बहना भी है?',
    te: 'తుమ్ములు లేదా ముక్కు కారటం ఉందా?'
  },
  stomach_pain: {
    en: 'Where exactly is the pain, upper or lower stomach?',
    hi: 'दर्द पेट के ऊपर है या नीचे?',
    te: 'నొప్పి కడుపు పై భాగంలోనా లేక కింది భాగంలోనా?'
  },
  vomiting: {
    en: 'How many times have you vomited today?',
    hi: 'आज कितनी बार उल्टी हुई?',
    te: 'ఈరోజు ఎంతసార్లు వాంతి జరిగింది?'
  },
  chest_pain: {
    en: 'Does the pain spread to arm or jaw?',
    hi: 'क्या दर्द हाथ या जबड़े में फैलता है?',
    te: 'నొప్పి చేతి లేదా దవడకి వ్యాపిస్తుందా?'
  },
  breathless: {
    en: 'Are you feeling breathless even at rest?',
    hi: 'क्या आराम में भी सांस फूल रही है?',
    te: 'విశ్రాంతిలో కూడా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?'
  },
  child_fever: {
    en: 'How old is the child?',
    hi: 'बच्चे की उम्र कितनी है?',
    te: 'పిల్ల వయసెంత?'
  },
  pregnancy: {
    en: 'How many months pregnant are you?',
    hi: 'आप कितने महीने गर्भवती हैं?',
    te: 'మీరు ఎంత నెలల గర్భవతిగా ఉన్నారు?'
  },
  bleeding: {
    en: 'Where is the bleeding from and how much?',
    hi: 'खून कहाँ से आ रहा है और कितना?',
    te: 'రక్తస్రావం ఎక్కడ నుండి, ఎంతగా ఉంది?'
  },
  burning_urine: {
    en: 'Do you have pain or frequent urination?',
    hi: 'पेशाब करते समय दर्द या बार-बार जाना हो रहा है?',
    te: 'మూత్రం చేసే సమయంలో నొప్పి లేదా తరచుగా పోతున్నారా?'
  },
  dizziness: {
    en: 'Did you faint or feel like fainting?',
    hi: 'क्या चक्कर के साथ बेहोशी हुई?',
    te: 'తల తిరుగుడు తో పాటు మూర్ఛ వచ్చినా?'
  },
  eye_pain: {
    en: 'Is there redness or discharge in the eye?',
    hi: 'आँख में लालिमा या पानी/मैल है?',
    te: 'కంటిలో ఎర్రదనం లేదా చీము ఉందా?'
  },
  ear_pain: {
    en: 'Is there ear discharge or hearing trouble?',
    hi: 'कान से पानी आना या सुनने में दिक्कत है?',
    te: 'కన్నులో నుంచి ద్రవం వస్తుందా లేదా వినికిడి సమస్య ఉందా?'
  },
  skin_rash: {
    en: 'Is the rash itchy or spreading?',
    hi: 'क्या रैश में खुजली है या फैल रहा है?',
    te: 'రాష్‌ లో దురద లేదా వ్యాప్తి ఉందా?'
  },
  weakness: {
    en: 'Are you also feeling dizzy or very tired?',
    hi: 'क्या चक्कर या बहुत थकान भी है?',
    te: 'తల తిరగడం లేదా చాలా అలసట ఉందా?'
  },
  joint_pain: {
    en: 'Which joint hurts the most?',
    hi: 'किस जोड़ में ज्यादा दर्द है?',
    te: 'ఏ జాయింట్‌లో ఎక్కువ నొప్పి ఉంది?'
  },
  back_pain: {
    en: 'Did the pain start after lifting or injury?',
    hi: 'क्या दर्द उठाने/चोट के बाद शुरू हुआ?',
    te: 'బరువు ఎత్తిన తర్వాత లేదా గాయంతో మొదలైందా?'
  },
  diabetes_symptoms: {
    en: 'Are you very thirsty or urinating often?',
    hi: 'क्या बहुत प्यास लगती है या बार-बार पेशाब आता है?',
    te: 'చాలా దాహం లేదా తరచుగా మూత్రం వస్తుందా?'
  }
}

const MicIcon = ({ size = 64, color = '#7bcaa4' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
  </svg>
)

const SpeakerIcon = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.2)" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)

export default function VoiceTriage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('gramdoc_lang') || 'en')
  const [voiceMode, setVoiceMode] = useState(getVoiceMode())
  const [phase, setPhase] = useState('idle')
  const [interimText, setInterimText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [conversation, setConversation] = useState([])
  const [urgency, setUrgency] = useState(null)
  const [summary, setSummary] = useState(null)
  const [aiMessage, setAiMessage] = useState('')
  const [visibleWords, setVisibleWords] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // ML State
  const [mlResults, setMlResults] = useState([])
  const [mlProcessing, setMlProcessing] = useState(false)
  
  const recognitionRef = useRef(null)
  const conversationRef = useRef([])
  const exchangeCount = useRef(0)
  const manualStopRef = useRef(false)
  const processResponseRef = useRef(null)
  const speakTokenRef = useRef(0)
  const listenRetryTimeoutRef = useRef(null)

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

  useEffect(() => {
    const syncLang = () => setLang(localStorage.getItem('gramdoc_lang') || 'en')
    window.addEventListener('languageChange', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('languageChange', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (listenRetryTimeoutRef.current) clearTimeout(listenRetryTimeoutRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (_) {}
      }
      speakTokenRef.current += 1
      stopSpeaking()
    }
  }, [])

  useEffect(() => { conversationRef.current = conversation }, [conversation])

  const safeSpeak = (text, onEnd) => {
    const token = ++speakTokenRef.current
    speak(text, () => {
      if (token !== speakTokenRef.current) return
      onEnd?.()
    })
  }

  const cancelActiveAudio = () => {
    speakTokenRef.current += 1
    stopSpeaking()
  }

  useEffect(() => {
    if (phase !== 'speaking' || !aiMessage) return
    setVisibleWords(0)
    const words = aiMessage.split(' ')
    let i = 0
    const iv = setInterval(() => { i++; setVisibleWords(i); if (i >= words.length) clearInterval(iv) }, 100)
    return () => clearInterval(iv)
  }, [aiMessage, phase])

  const runMLAnalysis = async (text) => {
    setMlProcessing(true)
    try {
      const allText = conversation
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join(' ') + ' ' + text
      
      const symptoms = extractSymptoms(allText)
      if (symptoms.length > 0) {
        const results = await analyzeSymptomsML(symptoms)
        setMlResults(results)
        return results
      }
      return []
    } catch (err) {
      console.error("ML Analysis Error:", err)
    } finally {
      setMlProcessing(false)
    }
  }

  const processResponse = async (userSpeech) => {
    exchangeCount.current += 1
    // Await ML analysis to ensure results are ready for potential fallback
    const freshML = await runMLAnalysis(userSpeech)
    
    setPhase('processing'); setInterimText('')
    const newConv = [...conversationRef.current, { role: 'user', text: userSpeech }]
    setConversation(newConv)

    try {
      if (!navigator.onLine) {
        const offlineSymptom = {
          symptoms: userSpeech,
          timestamp: Date.now(),
          patientId: api.getUser()?.id || 'guest',
          synced: false
        }
        const existing = JSON.parse(localStorage.getItem('gd_offline_symptoms') || '[]')
        localStorage.setItem('gd_offline_symptoms', JSON.stringify([...existing, offlineSymptom]))
        
        const offlineMsg = { 
          en: "📶 You are offline. Your symptoms will be saved and sent when internet returns.",
          hi: "📶 आप ऑफ़लाइन हैं। आपके लक्षणों को सहेजा जाएगा और इंटरनेट वापस आने पर भेजा जाएगा।",
          te: "📶 మీరు ఆఫ్ లైన్ లో ఉన్నారు. ఇంటర్నెట్ తిరిగి వచ్చినప్పుడు మీ లక్షణాలు సేవ్ చేయబడతాయి మరియు పంపబడతాయి."
        }[lang] || "You are offline. Saving symptoms locally..."
        
        setConversation([...newConv, { role: 'bot', text: offlineMsg }])
        setAiMessage(offlineMsg)
        setPhase('speaking')
        safeSpeak(offlineMsg, () => { setPhase('idle') })
        return
      }

      const langName = lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'
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

If patient says "headache":
  Ask: How long have you had this headache?
  Ask: Is it very severe or mild?
  Ask: Any vomiting or sensitivity to light?
  Ask: Did it start suddenly or slowly?

If patient says "child is sick":
  Ask: How old is the child?
  Ask: What are the symptoms?
  Ask: How many days has child been sick?
  Ask: Is child eating and drinking?

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

RULES:
1. Minimum 3 questions maximum 6 questions before diagnosis
2. If symptoms sound like emergency (chest pain, breathing trouble, unconscious, severe bleeding) classify HIGH and advise immediate care
3. Be conversational not robotic
4. Remember what patient said earlier in conversation
5. Never repeat a question already asked

URGENCY CLASSIFICATION:
HIGH: chest pain, difficulty breathing, unconscious, severe bleeding, signs of stroke, high fever in infant, pregnancy complications, suspected heart attack
MEDIUM: fever 2+ days, persistent vomiting, moderate pain, child illness, eye infections, ear pain, urinary issues
LOW: mild cold, minor cough, skin rash without fever, mild headache, minor injury, general weakness

After sufficient questions (minimum 3) output on its own line:
TRIAGE_COMPLETE: {"urgency":"HIGH/MEDIUM/LOW","symptoms":"patient's specific symptoms","doctor":"most relevant specialist","summary":"brief reassuring summary in ${langName}","duration":"how long patient has had problem","severity":"mild/moderate/severe","keyFindings":"2-3 important clinical points from conversation"}`

      const mlSummary = mlResults.length > 0 
        ? `\n\nINTERNAL ML ANALYSIS (Suspected): ${mlResults.map(r => `${r.name} (${(r.probability*100).toFixed(0)}%)`).join(', ')}. Use this to guide your conversation.`
        : '';

      const messagesForAi = [
        { role: 'system', text: SYSTEM_PROMPT + mlSummary },
        ...newConv.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }))
      ]

      const res = await api.triageChat(messagesForAi)
      const aiText = (res.reply || '').trim()

      if (!aiText) {
        fallbackReply(newConv, userSpeech, freshML)
        return
      }

      // Block premature conclusion
      if (aiText.includes('TRIAGE_COMPLETE:') && exchangeCount.current < 3) {
        const continueMessages = {
          en: 'Can you tell me more about your symptoms?',
          hi: 'क्या आप अपने लक्षणों के बारे में और बता सकते हैं?',
          te: 'మీ లక్షణాల గురించి మరింత చెప్పగలరా?'
        }
        const msg = continueMessages[lang] || continueMessages.en
        setConversation([...newConv, { role: 'bot', text: msg }])
        setAiMessage(msg); setPhase('speaking')
        safeSpeak(msg, () => { startListeningNow() })
        return
      }

      if (aiText.includes('TRIAGE_COMPLETE:')) {
        try {
          const raw = aiText.split('TRIAGE_COMPLETE:')[1] || ''
          const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
          const jsonStr = (jsonMatch ? jsonMatch[0] : cleaned).trim()
          const result = JSON.parse(jsonStr)
          
          setSummary(result); setUrgency(result.urgency)
          
          // Save for patient
          localStorage.setItem('gd_triage', JSON.stringify({
            urgency: result.urgency,
            symptoms: result.symptoms,
            doctor: result.doctor,
            summary: result.summary,
            duration: result.duration,
            severity: result.severity,
            keyFindings: result.keyFindings,
            language: lang,
            timestamp: new Date().toISOString()
          }))

          localStorage.setItem('gd_recommended_specialist', result.doctor)

          // Save ML results
          localStorage.setItem('gd_ml_results', JSON.stringify(mlResults))

          // Save for doctor (detailed summary)
          localStorage.setItem('gd_triage_summary', 
            `PATIENT TRIAGE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━
Complaint: ${result.symptoms}
Duration: ${result.duration}
Severity: ${result.severity}
Key Findings: ${result.keyFindings}
Urgency Level: ${result.urgency}
ML Analysis: ${mlResults[0]?.name || 'N/A'} (${(mlResults[0]?.probability * 100 || 0).toFixed(0)}%)
Recommended: ${result.doctor}
AI Assessment: ${result.summary}
━━━━━━━━━━━━━━━━━━━━━━
Generated by GramDoc AI Triage`)

          setConversation([...newConv, { role: 'bot', text: result.summary }])
          setAiMessage(result.summary); setPhase('speaking')
          safeSpeak(result.summary, () => setPhase('complete'))
        } catch (e) {
          console.error('Parse error', e)
          const withoutResult = aiText.replace(/TRIAGE_COMPLETE:[\s\S]*/i, '').trim()
          if (withoutResult) {
            setConversation([...newConv, { role: 'bot', text: withoutResult }])
            setAiMessage(withoutResult); setPhase('speaking')
            safeSpeak(withoutResult, () => { startListeningNow() })
          } else {
            fallbackReply(newConv, userSpeech)
          }
        }
      } else {
        setConversation([...newConv, { role: 'bot', text: aiText }])
        setAiMessage(aiText); setPhase('speaking')
        safeSpeak(aiText, () => { startListeningNow() })
      }
    } catch (err) {
      console.error('Triage error:', err)
      fallbackReply(newConv, userSpeech, freshML)
    }
  }

  const getFallbackQuestion = (text) => {
    const symptoms = extractSymptoms(text || '')
    const key = symptoms[0]
    const mapped = key ? FALLBACK_QUESTIONS[key] : null
    if (mapped) return mapped[lang] || mapped.en
    return {
      en: 'I understand. Please tell me more about how you feel.',
      hi: 'मैं समझता हूँ। कृपया बताइए आपको कैसा लग रहा है।',
      te: 'నాకు అర్థమైంది. దయచేసి మీకు ఎలా అనిపిస్తుందో ఇంకా చెప్పండి.'
    }[lang] || 'I understand. Please tell me more about how you feel.'
  }

  const fallbackReply = (conv, lastUserText, currentML = []) => {
    // Only complete after at least 3 exchanges to ensure enough questioning
    if (exchangeCount.current >= 3) {
      const top = currentML.length > 0 ? currentML[0] : {
        name: 'General Consultation',
        urgency: 'medium',
        doctor: 'General Physician',
        probability: 1
      }
      const specialist = top.doctor || (top.urgency === 'high' ? 'Specialist' : 'General Physician')
      
      const localResult = {
        urgency: top.urgency.toUpperCase(),
        symptoms: currentML.length > 0 ? currentML.map(r => r.name).join(', ') : lastUserText,
        doctor: specialist,
        summary: {
          en: `I have analyzed your symptoms. It seems you might have ${top.name}. I am preparing your health summary.`,
          hi: `मैंने आपके लक्षणों का विश्लेषण किया है। ऐसा लगता है कि आपको ${top.name} हो सकता है। मैं आपका स्वास्थ्य सारांश तैयार कर रहा हूँ।`,
          te: `నేను మీ లక్షణాలను విశ్లేషించాను. మీకు ${top.name} ఉన్నట్లు అనిపిస్తుంది. నేను మీ ఆరోగ్య సారాంశాన్ని సిద్ధం చేస్తున్నాను.`
        }[lang] || `Based on symptoms, it seems to be ${top.name}.`,
        duration: "Recent",
        severity: top.urgency,
        keyFindings: `Symptom patterns match ${top.name} (${(top.probability * 100).toFixed(0)}% confidence).`
      }

      // Save for patient
      localStorage.setItem('gd_triage', JSON.stringify({
        ...localResult,
        language: lang,
        timestamp: new Date().toISOString()
      }))

      localStorage.setItem('gd_recommended_specialist', localResult.doctor)

      // Save for doctor
      localStorage.setItem('gd_triage_summary', 
        `PATIENT TRIAGE SUMMARY (Local ML Fallback)
━━━━━━━━━━━━━━━━━━━━━━
Complaint: ${localResult.symptoms}
ML Analysis: ${top.name} (${(top.probability * 100).toFixed(0)}%)
Urgency Level: ${localResult.urgency}
Recommended: ${localResult.doctor}
Assessment: ${localResult.summary}
━━━━━━━━━━━━━━━━━━━━━━
Generated by GramDoc Local Triage`)

      setSummary(localResult); setUrgency(localResult.urgency)
      setConversation([...conv, { role: 'bot', text: localResult.summary }])
      setAiMessage(localResult.summary); setPhase('speaking')
      safeSpeak(localResult.summary, () => setPhase('complete'))
      return
    }

    const fb = getFallbackQuestion(lastUserText)
    setConversation([...conv, { role: 'bot', text: fb }])
    setAiMessage(fb); setPhase('speaking')
    safeSpeak(fb, () => { startListeningNow() })
  }

  processResponseRef.current = processResponse

  const startListeningNow = () => {
    if (listenRetryTimeoutRef.current) {
      clearTimeout(listenRetryTimeoutRef.current)
      listenRetryTimeoutRef.current = null
    }
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch(e) {} }
    setPhase('listening'); setInterimText(''); setTranscript('')
    manualStopRef.current = false
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice not supported. Please use Chrome.'); return }
    const r = new SR()
    r.lang = getLangCode()
    r.continuous = false
    r.interimResults = true
    r.maxAlternatives = 3
    let finalText = '', lastInterim = '', hasResult = false
    
    r.onresult = (e) => {
      hasResult = true
      let interimChunk = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const chunk = (e.results[i][0]?.transcript || '').trim()
        if (!chunk) continue
        if (e.results[i].isFinal) {
          finalText = `${finalText} ${chunk}`.trim()
        } else {
          interimChunk = `${interimChunk} ${chunk}`.trim()
        }
      }

      lastInterim = `${finalText} ${interimChunk}`.trim()
      setInterimText(lastInterim)

      if (finalText) {
        setTranscript(finalText)
        r.stop()
      }
    }
    r.onend = () => {
      recognitionRef.current = null
      const textToProcess = finalText.trim() || lastInterim.trim()
      if (textToProcess) processResponseRef.current(textToProcess)
      else if (!hasResult && !manualStopRef.current) {
        listenRetryTimeoutRef.current = setTimeout(() => {
          if (!manualStopRef.current) startListeningNow()
        }, 500)
      }
      else setPhase('idle')
    }
    r.onerror = () => {
      recognitionRef.current = null
      if (!manualStopRef.current) {
        toast.error(
          {
            en: 'Could not hear clearly. Please try again.',
            hi: 'आवाज साफ़ नहीं मिली। कृपया फिर से कोशिश करें।',
            te: 'ఆవాజ్ స్పష్టంగా వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.'
          }[lang] || 'Could not hear clearly. Please try again.'
        )
      }
      setPhase('idle')
    }
    recognitionRef.current = r
    try { r.start() } catch(e) { setPhase('idle') }
  }

  const stopListening = () => {
    manualStopRef.current = true
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  const startConversation = () => {
    if (phase !== 'idle') return
    const greeting = T.greet[lang]
    setConversation([{ role: 'bot', text: greeting }])
    setAiMessage(greeting); setPhase('speaking')
    safeSpeak(greeting, () => { startListeningNow() })
  }

  const COLORS = { forest: '#0f3d2a', mint: '#7bcaa4', mintLight: '#e8f5ee', warmGray: '#6b5e50', critical: '#ef4444', amber: '#f59e0b' }
  const setPreferredVoiceMode = (mode) => {
    setVoiceMode(mode)
    localStorage.setItem('gd_tts_mode', mode)
    const messages = {
      native: {
        en: 'Native language voice enabled',
        hi: 'मूल भाषा आवाज सक्षम की गई',
        te: 'స్థానిక భాష వాయిస్ ప్రారంభించబడింది'
      },
      english_fallback: {
        en: 'English fallback voice enabled',
        hi: 'अंग्रेजी फॉलबैक आवाज सक्षम की गई',
        te: 'ఇంగ్లీష్ ఫాల్బ్యాక్ వాయిస్ ప్రారంభించబడింది'
      }
    }
    toast.success(messages[mode]?.[lang] || messages[mode]?.en)
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a1a0f 0%, #0f3d2a 50%, #0a2a1c 100%)', height: '100%', minHeight: 560, overflow: 'hidden', position: 'relative', fontFamily: 'Mukta, sans-serif', borderRadius: 16 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 20 }}>
        {!isOnline && (
          <div style={{ 
            background: '#FEF3C7', border: '1px solid #F59E0B', 
            padding: '8px 16px', borderRadius: 12, color: '#92400E', 
            fontSize: '11px', fontWeight: 600, width: '100%',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span>📶</span>
            { { en: 'Offline. Symptoms will be saved and sent when connected.', hi: 'ऑफ़लाइन। लक्षण सहेजे जाएंगे और कनेक्ट होने पर भेजे जाएंगे।', te: 'ఆఫ్‌లైన్. కనెక్ట్ అయినప్పుడు లక్షణాలు సేవ్ చేసి పంపబడతాయి.' }[lang] }
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { cancelActiveAudio(); navigate('/app') }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}>←</button>
          <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 18, color: '#7bcaa4' }}>GramDoc AI</div>
          <div style={{ background: '#fdf6ec', color: '#0f3d2a', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{T.langBadge[lang]}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setPreferredVoiceMode('native')}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: voiceMode === 'native' ? '1px solid #7bcaa4' : '1px solid rgba(255,255,255,0.25)',
              background: voiceMode === 'native' ? 'rgba(123,202,164,0.2)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {{
              en: 'Use native voice',
              hi: 'मूल भाषा आवाज उपयोग करें',
              te: 'స్థానిక వాయిస్ ఉపయోగించండి'
            }[lang]}
          </button>
          <button
            onClick={() => setPreferredVoiceMode('english_fallback')}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: voiceMode === 'english_fallback' ? '1px solid #7bcaa4' : '1px solid rgba(255,255,255,0.25)',
              background: voiceMode === 'english_fallback' ? 'rgba(123,202,164,0.2)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {{
              en: 'Use English fallback voice',
              hi: 'अंग्रेजी फॉलबैक आवाज उपयोग करें',
              te: 'ఇంగ్లీష్ ఫాల్బ్యాక్ వాయిస్ ఉపయోగించండి'
            }[lang]}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 560, padding: '80px 20px', position: 'relative', zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ width: 180, height: 180, borderRadius: '50%', background: 'rgba(123,202,164,0.1)', border: '2px solid rgba(123,202,164,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <MicIcon size={64} />
              </motion.div>
              <h2 style={{ fontFamily: 'Fraunces', color: 'white', fontSize: 24 }}>{T.idle[lang]}</h2>
              <button onClick={startConversation} style={{ marginTop: 24, padding: '16px 40px', borderRadius: 32, background: 'linear-gradient(135deg, #7bcaa4, #1d9e75)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{T.speakBtn[lang]}</button>
            </motion.div>
          )}

          {phase === 'listening' && (
            <motion.div key="listening" onClick={stopListening} style={{ textAlign: 'center', width: '100%', cursor: 'pointer' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
                <MicIcon size={48} color="white" />
              </div>
              <h2 style={{ color: 'white', opacity: 0.8 }}>{T.listening[lang]}</h2>
              <p style={{ color: '#ef4444', fontWeight: 800 }}>
                { { en: '🛑 Tap anywhere to stop', hi: '🛑 रोकने के लिए कहीं भी दबाएं', te: '🛑 ఆపడానికి ఎక్కడైనా నొక్కండి' }[lang] }
              </p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 16, marginTop: 20, color: 'white', minHeight: 80 }}>{interimText || T.placeholder[lang]}</div>
            </motion.div>
          )}

          {phase === 'speaking' && (
            <motion.div key="speaking" style={{ textAlign: 'center' }}>
              <SpeakerIcon size={80} />
              <p style={{ color: 'white', fontSize: 22, marginTop: 24, fontStyle: 'italic', maxWidth: 600 }}>{aiMessage}</p>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="processing" style={{ color: 'white', width: '100%', maxWidth: 400, textAlign: 'center' }}>
              <div style={{ marginBottom: 32 }}>{T.processing[lang]}</div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: COLORS.mint, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>
                  { { en: '🧠 AI Disease Prediction', hi: '🧠 एआई रोग अनुमान', te: '🧠 AI వ్యాధి అంచనా' }[lang] }
                </div>
                
                {mlProcessing || mlResults.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {mlResults.map((res, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 80, fontSize: 11, fontWeight: 700, textAlign: 'left', color: 'white' }}>{res.name}</div>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${res.probability * 100}%` }} 
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ height: '100%', background: res.color, borderRadius: 3 }} 
                          />
                        </div>
                        <div style={{ width: 35, fontSize: 10, fontWeight: 800, textAlign: 'right', color: 'white' }}>{(res.probability * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: mlResults[0]?.urgency === 'high' ? COLORS.critical : mlResults[0]?.urgency === 'medium' ? COLORS.amber : COLORS.mint }}>
                      { { en: 'PREDICTED URGENCY', hi: 'अनुमानित तात्कालिकता', te: 'అంచనా అత్యవసరం' }[lang] }: {getMLUrgency(mlResults).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {phase === 'complete' && summary && (
            <motion.div key="complete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 560 }}>
              <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                <div style={{ color: COLORS.mint, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>
                  { { en: '📋 Health Summary', hi: '📋 स्वास्थ्य सारांश', te: '📋 ఆరోగ్య సారాంశం' }[lang] }
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.warmGray }}>{ { en: 'Symptoms', hi: 'लक्षण', te: 'లక్షణాలు' }[lang] }</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest }}>{summary.symptoms}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.warmGray }}>{ { en: 'Since', hi: 'कब से', te: 'ఎప్పటి నుంచి' }[lang] }</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest }}>{summary.duration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.warmGray }}>{ { en: 'Severity', hi: 'गंभीरता', te: 'తీవ్రత' }[lang] }</span>
                    <span style={{ fontSize: 10, fontWeight: 800, background: COLORS.mintLight, color: COLORS.forest, padding: '4px 10px', borderRadius: 12 }}>{summary.severity?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.warmGray }}>{ { en: 'Urgency', hi: 'तात्कालिकता', te: 'అత్యవసరం' }[lang] }</span>
                    <span style={{ fontSize: 10, fontWeight: 800, background: summary.urgency === 'HIGH' ? COLORS.critical : summary.urgency === 'MEDIUM' ? COLORS.amber : COLORS.mint, color: 'white', padding: '4px 10px', borderRadius: 12 }}>{summary.urgency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.warmGray }}>{ { en: 'Recommended Doctor', hi: 'सुझाए गए डॉक्टर', te: 'సిఫారసు చేసిన వైద్యుడు' }[lang] }</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest }}>{summary.doctor}</span>
                  </div>
                  
                  <div style={{ marginTop: 12, padding: 16, background: '#fdf6ec', borderRadius: 16 }}>
                    <div style={{ color: COLORS.mint, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
                      { { en: '🧠 ML Disease Analysis', hi: '🧠 एमएल रोग विश्लेषण', te: '🧠 ఎంఎల్ వ్యాధి విశ్లేషణ' }[lang] }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {mlResults.slice(0, 3).map((res, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: COLORS.forest }}>{res.name}</div>
                          <div style={{ width: 80, height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${res.probability * 100}%`, background: res.color, borderRadius: 2 }} />
                          </div>
                          <div style={{ width: 30, fontSize: 10, fontWeight: 800, color: COLORS.forest, textAlign: 'right' }}>{(res.probability * 100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: COLORS.warmGray, textTransform: 'uppercase' }}>{ { en: 'Key Findings', hi: 'मुख्य निष्कर्ष', te: 'ముఖ్య వివరాలు' }[lang] }</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, fontStyle: 'italic' }}>{summary.keyFindings}</span>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 10, color: COLORS.warmGray, textTransform: 'uppercase', marginBottom: 8 }}>{ { en: 'AI Notes:', hi: 'एआई नोट्स:', te: 'AI గమనికలు:' }[lang] }</div>
                  <div style={{ fontSize: 14, fontStyle: 'italic', color: COLORS.forest, lineHeight: 1.5 }}>"{summary.summary}"</div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                  <button onClick={() => {
                    localStorage.setItem('gd_recommended_specialist', summary.doctor)
                    navigate('/app/doctors')
                  }} style={{ flex: 1, padding: '16px', borderRadius: 16, background: COLORS.forest, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    { { en: 'Talk to Doctor Now', hi: 'अभी डॉक्टर से बात करें', te: 'ఇప్పుడే డాక్టర్‌తో మాట్లాడండి' }[lang] }
                  </button>
                  <button onClick={() => window.location.reload()} style={{ padding: '16px 24px', borderRadius: 16, background: '#f0f0f0', color: COLORS.warmGray, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    { { en: 'Restart', hi: 'फिर से शुरू करें', te: 'మళ్లీ ప్రారంభించండి' }[lang] }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
