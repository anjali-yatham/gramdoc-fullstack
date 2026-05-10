import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ─── COMPLETE SYMPTOM DECISION TREES ─────────────────────────────────────────
const SYMPTOM_TREES = {
  fever: {
    label: 'Fever', icon: '🤒',
    keywords: ['fever','bukhar','jvaram','hot','temperature','jaram','pachhi'],
    questions: [
      { id: 'duration',    en: 'How many days have you had fever?',                         hi: 'Kitne din se bukhar hai?',                    te: 'Enni rojulu jvaram undi?' },
      { id: 'temperature', en: 'Is your temperature above 100 degrees?',                    hi: 'Kya 100 degree se upar hai?',                 te: '100 degrees kante ekku va undaa?' },
      { id: 'headache',    en: 'Do you have a headache with the fever?',                    hi: 'Kya sar mein dard bhi hai?',                  te: 'Tala noppi kuda undaa?' },
      { id: 'bodyache',    en: 'Do you have body aches or joint pain?',                     hi: 'Badan ya jodo mein dard hai?',                te: 'Anga vedana ledaa moka noppi undaa?' },
      { id: 'cough',       en: 'Do you also have cough or cold?',                           hi: 'Khansi ya sardi bhi hai kya?',                te: 'Daggula pai daari kuda undaa?' },
    ],
    analyze(ans) {
      const days = parseInt(ans.duration) || 1
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|ho/i.test(v || '')
      const high = isYes(ans.temperature), head = isYes(ans.headache)
      const body = isYes(ans.bodyache), cough = isYes(ans.cough)
      let condition = 'Viral Fever', urgency = 'medium'
      let meds = ['Paracetamol 500mg — 1 tablet 3 times daily after food', 'ORS Sachet — drink 1 litre daily', 'Plenty of rest and fluids']
      if (high && head && body) {
        condition = 'Possible Dengue Fever'
        urgency = 'high'
        meds = ['Paracetamol 500mg ONLY — do NOT take Brufen or Ibuprofen', 'ORS Sachet every 2 hours', 'CBC blood test urgently needed', 'See doctor immediately']
      } else if (cough && high) {
        condition = 'Respiratory Infection with Fever'
        urgency = 'medium'
        meds = ['Paracetamol 500mg 3 times daily', 'Cetirizine 10mg once at night', 'Steam inhalation twice daily']
      } else if (days > 5) {
        condition = 'Prolonged Fever — needs investigation'
        urgency = 'high'
        meds = ['Paracetamol 500mg for fever', 'Blood test recommended', 'See doctor urgently']
      }
      return {
        condition, urgency, specialist: 'General Physician',
        medicines: meds,
        summary: `Patient reports ${condition} for ${days} days.${head ? ' Headache present.' : ''}${body ? ' Body aches present.' : ''}${cough ? ' Cough also present.' : ''} Urgency level: ${urgency.toUpperCase()}.`
      }
    }
  },

  cough: {
    label: 'Cough / Cold', icon: '😮‍💨',
    keywords: ['cough','khansi','daggula','cold','sardi','nazla','sneeze','throat'],
    questions: [
      { id: 'duration',   en: 'How many days have you had this cough?',                     hi: 'Kitne din se khansi hai?',                    te: 'Enni rojulu daggula pai daari undi?' },
      { id: 'type',       en: 'Is your cough dry or do you cough up phlegm?',               hi: 'Khansi sukhi hai ya balgam aata hai?',        te: 'Podi ga undi leda balgam vastundaa?' },
      { id: 'fever',      en: 'Do you also have fever along with the cough?',               hi: 'Kya khansi ke saath bukhar bhi hai?',         te: 'Daggula tho paatu jvaram kuda undaa?' },
      { id: 'breathless', en: 'Do you feel breathless or chest tightness?',                 hi: 'Sans lene mein takleef ya seene mein dard?',  te: 'Swasa teesukovanatam kashtam ga undaa?' },
      { id: 'night',      en: 'Is the cough worse at night or in the morning?',             hi: 'Raat ya subah khansi zyada hoti hai?',        te: 'Raatri ledaa tella vaari poottu daggula ekkuvaa undaa?' },
    ],
    analyze(ans) {
      const days = parseInt(ans.duration) || 1
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|balgam|phlegm/i.test(v || '')
      const wet = isYes(ans.type), breathless = isYes(ans.breathless), fever = isYes(ans.fever)
      let condition = 'Common Cold', urgency = 'low'
      let meds = ['Cetirizine 10mg once at night', 'Steam inhalation twice daily', 'Warm water gargles', 'Drink warm fluids']
      if (breathless) {
        condition = 'Possible Asthma or Bronchitis'
        urgency = 'high'
        meds = ['See doctor immediately', 'Do not delay — breathlessness is serious', 'Salbutamol inhaler may be needed']
      } else if (wet && fever) {
        condition = 'Chest Infection with Fever'
        urgency = 'medium'
        meds = ['Paracetamol 500mg 3 times daily', 'Steam inhalation', 'Antibiotics may be needed — see doctor']
      } else if (days > 14) {
        condition = 'Chronic Cough — needs evaluation'
        urgency = 'medium'
        meds = ['See doctor for proper diagnosis', 'Could be allergy or TB', 'Avoid dusty environments']
      }
      return {
        condition, urgency,
        specialist: breathless ? 'Pulmonologist' : 'General Physician',
        medicines: meds,
        summary: `Patient has ${condition} for ${days} days.${wet ? ' Productive (wet) cough.' : ' Dry cough.'}${breathless ? ' BREATHLESSNESS reported — urgent attention needed.' : ''}${fever ? ' Fever also present.' : ''}`
      }
    }
  },

  stomach: {
    label: 'Stomach Pain', icon: '🤕',
    keywords: ['stomach','belly','abdomen','koota','pet','noppi','pain','dard','vomit','vanti','loose','vinchulu','diarrhea','gas'],
    questions: [
      { id: 'location',   en: 'Where is your pain — upper stomach, lower stomach, or everywhere?',  hi: 'Dard kahan hai — upar, neeche ya pure pet mein?', te: 'Noppi ekkada undi — paina, kruinda, ledaa ante ante undaa?' },
      { id: 'duration',   en: 'How many days have you had this stomach pain?',                      hi: 'Kitne din se pet mein dard hai?',                  te: 'Enni rojulu nundi koota noppi undi?' },
      { id: 'vomiting',   en: 'Do you have vomiting or feeling of nausea?',                        hi: 'Ulti aa rahi hai ya jee mishalna hai?',            te: 'Vanti vastundaa ledaa kadupu tippigaa undaa?' },
      { id: 'motions',    en: 'Do you have loose motions or diarrhea?',                            hi: 'Dast ho rahe hain kya?',                           te: 'Vinchulu unnayaa?' },
      { id: 'food',       en: 'Did you eat anything different or outside food recently?',           hi: 'Kya aapne kuch alag ya bahar ka khaana khaya?',   te: 'Itta kadaa emaina tinna vaa cheppukontaaraa?' },
    ],
    analyze(ans) {
      const days = parseInt(ans.duration) || 1
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|ho|upper|paina|upar/i.test(v || '')
      const upper = /upper|upar|paina|above/i.test(ans.location || '')
      const vomit = isYes(ans.vomiting), motions = isYes(ans.motions), badFood = isYes(ans.food)
      let condition = 'Stomach Pain', urgency = 'medium'
      let meds = ['ORS Sachet to stay hydrated', 'Light food — rice, curd, banana', 'Avoid spicy and oily food']
      if (upper && vomit) {
        condition = 'Gastritis or Acid Reflux'
        urgency = 'medium'
        meds = ['Pantoprazole 40mg before breakfast', 'Antacid after meals', 'Avoid spicy food and tea on empty stomach']
      } else if (motions && vomit && badFood) {
        condition = 'Food Poisoning'
        urgency = 'high'
        meds = ['ORS Sachet every hour', 'Ondansetron for vomiting', 'See doctor immediately if blood in stool', 'No solid food for 6 hours']
      } else if (motions && days > 2) {
        condition = 'Diarrhea / Gastroenteritis'
        urgency = 'medium'
        meds = ['ORS Sachet every 200ml of stool passed', 'Zinc tablet once daily for 14 days', 'Boiled water only', 'See doctor if not improving']
      } else if (!upper && !vomit && !motions) {
        condition = 'Possible Appendicitis or Kidney Issue'
        urgency = 'high'
        meds = ['See doctor urgently', 'Do not take painkillers before diagnosis', 'Ultrasound may be needed']
      }
      return {
        condition, urgency, specialist: urgency === 'high' ? 'Gastroenterologist' : 'General Physician',
        medicines: meds,
        summary: `Patient has ${condition} in the ${upper ? 'upper' : 'lower'} abdomen for ${days} days.${vomit ? ' Vomiting present.' : ''}${motions ? ' Loose motions present.' : ''}${badFood ? ' Possible food poisoning.' : ''}`
      }
    }
  },

  headache: {
    label: 'Headache', icon: '🧠',
    keywords: ['headache','head','tala','sar','noppi','dard','migraine','pain'],
    questions: [
      { id: 'duration',  en: 'How many days have you had this headache?',                          hi: 'Kitne din se sar dard hai?',                   te: 'Enni rojulu nundi tala noppi undi?' },
      { id: 'location',  en: 'Is the pain on one side of head or all over?',                      hi: 'Dard ek taraf hai ya pure sar mein?',          te: 'Oka vaipuna undaa ledaa ante ante undaa?' },
      { id: 'vision',    en: 'Do you have blurred vision or seeing flashes of light?',            hi: 'Aankhon mein dhundhlaapan ya roshni dikhti hai?', te: 'Kannu lanu choopu thakkuva ga undaa?' },
      { id: 'vomiting',  en: 'Do you have vomiting or nausea with the headache?',                hi: 'Sar dard ke saath ulti bhi hai kya?',          te: 'Tala noppi tho paatu vanti vastundaa?' },
      { id: 'fever',     en: 'Do you also have fever or stiff neck?',                             hi: 'Bukhar ya gardan mein akdahat bhi hai?',       te: 'Jvaram ledaa meda akarunagaa undaa?' },
    ],
    analyze(ans) {
      const days = parseInt(ans.duration) || 1
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|one|oka/i.test(v || '')
      const oneSide = isYes(ans.location), vision = isYes(ans.vision)
      const vomit = isYes(ans.vomiting), fever = isYes(ans.fever)
      let condition = 'Tension Headache', urgency = 'low'
      let meds = ['Paracetamol 500mg as needed', 'Rest in quiet dark room', 'Cold or warm compress on forehead', 'Stay hydrated']
      if (vision && vomit && oneSide) {
        condition = 'Migraine'
        urgency = 'medium'
        meds = ['Sumatriptan or Ibuprofen at onset', 'Rest in dark quiet room', 'Avoid triggers — bright light, loud sounds', 'See neurologist for recurring migraines']
      } else if (fever && vomit) {
        condition = 'Possible Meningitis — EMERGENCY'
        urgency = 'high'
        meds = ['GO TO HOSPITAL IMMEDIATELY', 'Do not delay — this is a medical emergency', 'Call ambulance: 108']
      } else if (days > 7) {
        condition = 'Chronic Headache — needs evaluation'
        urgency = 'medium'
        meds = ['See neurologist', 'Blood pressure check needed', 'Eye test may be needed', 'Avoid self-medication']
      }
      return {
        condition, urgency, specialist: urgency === 'high' ? 'Neurologist — EMERGENCY' : oneSide ? 'Neurologist' : 'General Physician',
        medicines: meds,
        summary: `Patient has ${condition} for ${days} days.${oneSide ? ' One-sided pain (possible migraine).' : ''}${vision ? ' Visual disturbances reported.' : ''}${fever ? ' FEVER WITH HEADACHE — meningitis risk.' : ''}`
      }
    }
  },

  chest: {
    label: 'Chest Pain', icon: '❤️',
    keywords: ['chest','seena','rombe','pain','dard','noppi','heart','breathless','swasa','tightness'],
    questions: [
      { id: 'duration',    en: 'How long have you had this chest pain — hours or days?',         hi: 'Seene mein dard kitne time se hai?',         te: 'Rombe noppi enni gantalu nundi undi?' },
      { id: 'spreading',   en: 'Does the pain spread to your arm, jaw, or back?',               hi: 'Dard haath, jada ya peeth tak jaata hai?',   te: 'Noppi cheyyi, gurraalu ledaa veepu ki vastundaa?' },
      { id: 'breathless',  en: 'Are you feeling breathless or difficulty breathing?',           hi: 'Sans lene mein takleef ho rahi hai?',        te: 'Swasa teesukovanatam kashtam ga undaa?' },
      { id: 'sweating',    en: 'Are you sweating heavily or feeling cold and clammy?',          hi: 'Zyada paseena aa raha hai ya thanda lag raha?', te: 'Ekkuva chamma vastundaa ledaa thadi thadi ga undaa?' },
      { id: 'sudden',      en: 'Did the pain start suddenly or gradually?',                     hi: 'Dard achanak aaya ya dheere dheere?',        te: 'Noppi okkasarigaa vaccindaa ledaa mellaga vaccindaa?' },
    ],
    analyze(ans) {
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|sudden|okkasari|spreading|jaw|arm/i.test(v || '')
      const spreading = isYes(ans.spreading), breathless = isYes(ans.breathless)
      const sweating = isYes(ans.sweating), sudden = isYes(ans.sudden)
      let condition = 'Chest Pain — needs evaluation', urgency = 'high'
      let meds = ['CALL 108 IMMEDIATELY', 'Do not ignore chest pain', 'Sit upright and rest', 'Chew aspirin 325mg if available and not allergic']
      if (spreading && sweating && sudden) {
        condition = 'POSSIBLE HEART ATTACK — EMERGENCY'
        urgency = 'critical'
        meds = ['CALL 108 AMBULANCE IMMEDIATELY', 'Chew Aspirin 325mg NOW', 'Sit upright — do not lie down', 'Loosen tight clothing', 'Do not eat or drink anything']
      } else if (breathless && !spreading) {
        condition = 'Possible Pulmonary Issue or Anxiety'
        urgency = 'high'
        meds = ['See doctor urgently', 'Breathe slowly and deeply', 'Could be anxiety attack — stay calm']
      }
      return {
        condition, urgency, specialist: 'Cardiologist — URGENT',
        medicines: meds,
        summary: `URGENT: Patient reports ${condition}.${spreading ? ' Pain spreading to arm/jaw.' : ''}${sweating ? ' Heavy sweating reported.' : ''}${sudden ? ' Sudden onset.' : ''} NEEDS IMMEDIATE MEDICAL ATTENTION.`
      }
    }
  },

  pregnancy: {
    label: 'Pregnancy', icon: '🤰',
    keywords: ['pregnant','pregnancy','garbha','baby','period','mama','prenatal','antenatal','anc','month'],
    questions: [
      { id: 'weeks',    en: 'How many months or weeks pregnant are you?',                  hi: 'Aap kitne mahine ya hafte ki pregnant hain?', te: 'Mee pregnancy enni nelalu ledaa vaaram lu undi?' },
      { id: 'pain',     en: 'Do you have any stomach pain or cramps?',                    hi: 'Pet mein dard ya ainthan hai?',               te: 'Koota lo noppi ledaa aakarunagaa undaa?' },
      { id: 'bleeding', en: 'Do you have any bleeding or spotting?',                      hi: 'Koi bleeding ya dhabbe aa rahe hain?',        te: 'Elaana bleeding undaa?' },
      { id: 'swelling', en: 'Do you have swelling in legs or face?',                     hi: 'Pair ya chehre mein sujan hai?',              te: 'Kallu ledaa mukku lo voduppu undaa?' },
      { id: 'movement', en: 'If more than 5 months — have you felt baby movements?',     hi: 'Agar 5 mahine se zyada hai — bacche ki halchal feel ho rahi?', te: '5 nelalu aipoinaa — pillala kalana lalu telustunnaya?' },
    ],
    analyze(ans) {
      const weeks = parseInt(ans.weeks) || 0
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|bleeding|no movement/i.test(v || '')
      const pain = isYes(ans.pain), bleeding = isYes(ans.bleeding)
      const swelling = isYes(ans.swelling), noMovement = /no|ledu|nahi/i.test(ans.movement || '')
      let condition = 'Routine Antenatal Checkup Needed', urgency = 'low'
      let meds = ['Folic Acid tablet daily', 'Iron + Folic Acid tablet daily', 'Calcium supplement', 'Regular ANC checkups', 'Nutritious diet — green vegetables, milk, eggs']
      if (bleeding) {
        condition = 'PREGNANCY BLEEDING — EMERGENCY'
        urgency = 'high'
        meds = ['GO TO HOSPITAL IMMEDIATELY', 'Call 108 ambulance', 'Do not delay — bleeding in pregnancy is serious']
      } else if (pain && weeks > 20) {
        condition = 'Abdominal Pain in Pregnancy — needs assessment'
        urgency = 'high'
        meds = ['See doctor immediately', 'Could be preterm labor or placental issue', 'Do not take painkillers without doctor advice']
      } else if (swelling && weeks > 24) {
        condition = 'Possible Pre-eclampsia — high blood pressure risk'
        urgency = 'high'
        meds = ['Check blood pressure immediately', 'See doctor today', 'Reduce salt intake', 'Rest with feet elevated']
      } else if (noMovement && weeks > 20) {
        condition = 'Reduced Baby Movement — needs monitoring'
        urgency = 'high'
        meds = ['See doctor today for fetal monitoring', 'Do not panic but do not delay', 'Count kicks — should feel 10 kicks in 2 hours']
      }
      return {
        condition, urgency, specialist: 'Gynaecologist',
        medicines: meds,
        summary: `Pregnant patient at ${weeks} weeks/months. ${condition}.${bleeding ? ' BLEEDING reported — emergency.' : ''}${swelling ? ' Swelling present — BP check needed.' : ''}${pain ? ' Abdominal pain reported.' : ''}`
      }
    }
  },

  child: {
    label: 'Child Illness', icon: '👶',
    keywords: ['child','baby','kid','pillala','baccha','infant','son','daughter','fever child','sick child'],
    questions: [
      { id: 'age',         en: 'How old is the child — months or years?',                     hi: 'Baccha kitne mahine ya saal ka hai?',        te: 'Pillalauku enni nelalu ledaa samvatsaraalu?' },
      { id: 'symptom',     en: 'What is the main problem — fever, cough, vomiting, or rash?', hi: 'Main taklif kya hai — bukhar, khansi, ulti ya daane?', te: 'Pramukha samasya emiti — jvaram, daggula, vanti ledaa machi machi?' },
      { id: 'duration',    en: 'How many days has the child had this problem?',               hi: 'Bacche ko ye taklif kitne din se hai?',      te: 'Pillalauku ee samasya enni rojulu nundi undi?' },
      { id: 'feeding',     en: 'Is the child eating and drinking normally?',                  hi: 'Kya baccha khaana peena sahi se kar raha hai?', te: 'Pillalaadu baagaa tinnadam tagadam chestaadaa?' },
      { id: 'breathing',   en: 'Is the child breathing fast or having difficulty breathing?', hi: 'Kya baccha tezi se saans le raha hai?',      te: 'Pillalaadu veegam ga swasa teestunaadaa?' },
    ],
    analyze(ans) {
      const age = parseInt(ans.age) || 1
      const isYes = v => /yes|haa|avunu|ha|aunu|undi|hai|fever|jvaram|bukhar|fast|vomit|rash/i.test(v || '')
      const feeding = /no|ledu|nahi|not/i.test(ans.feeding || '')
      const breathing = isYes(ans.breathing), days = parseInt(ans.duration) || 1
      const symptom = ans.symptom || ''
      let condition = 'Child Illness', urgency = 'medium'
      let meds = ['Paracetamol syrup as per weight', 'ORS for hydration', 'See pediatrician']
      if (breathing) {
        condition = 'Child Breathing Difficulty — EMERGENCY'
        urgency = 'high'
        meds = ['GO TO HOSPITAL IMMEDIATELY', 'Call 108 now', 'Keep child upright', 'Do not give food or water']
      } else if (age < 3 && /fever|jvaram|bukhar/i.test(symptom)) {
        condition = 'Infant Fever — needs immediate attention'
        urgency = 'high'
        meds = ['See doctor immediately for infants under 3 months', 'Paracetamol syrup ONLY as per weight', 'Tepid sponging', 'Do not give adult medicines']
      } else if (feeding && days > 2) {
        condition = 'Child Not Eating — risk of dehydration'
        urgency = 'medium'
        meds = ['ORS every 30 minutes', 'Small sips of water or coconut water', 'See doctor today', 'Watch for signs of dehydration']
      }
      return {
        condition, urgency, specialist: 'Pediatrician',
        medicines: meds,
        summary: `${age} year old child with ${condition} for ${days} days.${breathing ? ' BREATHING DIFFICULTY — emergency.' : ''}${feeding ? ' Not feeding properly.' : ''}`
      }
    }
  }
}

// ─── ML CLASSIFIER (TensorFlow-style scoring without heavy library) ────────────
function classifySymptom(text) {
  const lower = text.toLowerCase()
  const scores = {}
  for (const [key, tree] of Object.entries(SYMPTOM_TREES)) {
    scores[key] = 0
    for (const kw of tree.keywords) {
      if (lower.includes(kw)) scores[key] += 10
    }
    // Partial match scoring
    for (const kw of tree.keywords) {
      const words = kw.split(' ')
      for (const w of words) {
        if (w.length > 3 && lower.includes(w)) scores[key] += 3
      }
    }
  }
  // Find best match
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1])
  if (best[0][1] === 0) return null
  return best[0][0]
}

// ─── SPEECH HELPERS ────────────────────────────────────────────────────────────
function speak(text, lang = 'en') {
  if (!window.speechSynthesis) return Promise.resolve()
  return new Promise(resolve => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const langCodes = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }
    const voice = voices.find(v => v.lang === langCodes[lang])
      || voices.find(v => v.lang.startsWith(lang))
      || voices.find(v => v.lang.startsWith('en'))
    if (voice) u.voice = voice
    u.lang = langCodes[lang] || 'en-IN'
    u.rate = 0.85
    u.pitch = 1.05
    u.volume = 1
    u.onend = resolve
    u.onerror = resolve
    window.speechSynthesis.speak(u)
  })
}

function listenOnce(lang = 'en', timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { reject(new Error('Speech recognition not supported')); return }
    const r = new SR()
    recognitionRef.current = r
    const langCodes = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }
    r.lang = langCodes[lang] || 'en-IN'
    r.interimResults = false
    r.maxAlternatives = 1
    r.continuous = true
    r.autoRestart = true
    let done = false
    
    const timer = setTimeout(() => { 
      if (!done) { 
        done = true
        try { r.stop() } catch(e) {}
        reject(new Error('timeout - no speech detected')) 
      } 
    }, timeoutMs)
    
    r.onstart = () => {
      console.log('✓ Listening started - speak now...')
    }
    
    r.onresult = e => {
      console.log('Result event fired, results:', e.results)
      if (done) return
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript.trim()
        console.log('Transcript:', transcript, 'Confidence:', e.results[i][0].confidence)
        
        if (transcript && e.results[i].isFinal) {
          console.log('✓ Got final result:', transcript)
          done = true
          clearTimeout(timer)
          try { r.stop() } catch(e) {}
          resolve(transcript)
          return
        }
      }
    }
    
    r.onerror = e => { 
      console.log('✗ Speech recognition error:', e.error)
      if (!done) { 
        done = true
        clearTimeout(timer)
        try { r.stop() } catch(e) {}
        reject(new Error('Speech error: ' + e.error)) 
      } 
    }
    
    r.onend = () => { 
      console.log('Recognition ended')
      if (!done) {
        console.log('Restarting recognition...')
        try { r.start() } catch(e) {
          console.log('Could not restart:', e)
        }
      }
    }
    
    try {
      r.start()
    } catch(e) {
      console.log('Error starting recognition:', e)
      reject(e)
    }
  })
}

// ─── WAVEFORM COMPONENT ────────────────────────────────────────────────────────
function Waveform({ active }) {
  const bars = [4,7,12,18,12,20,12,18,12,7,4]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, height:40 }}>
      {bars.map((h,i) => (
        <motion.div key={i}
          style={{ width:4, borderRadius:4, background:'#7bcaa4', originY:0.5 }}
          animate={active ? { height:[h,h*2.5,h*0.4,h*2,h], opacity:[0.5,1,0.4,1,0.5] } : { height:4, opacity:0.3 }}
          transition={active ? { duration:0.8, repeat:Infinity, delay:i*0.07, ease:'easeInOut' } : { duration:0.3 }}
        />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function VoiceTriage() {
  const nav = useNavigate()
  const lang = localStorage.getItem('gramdoc_lang') || 'en'
  const user = JSON.parse(localStorage.getItem('gramdoc_user') || '{}')

  const [phase, setPhase] = useState('intro')     // intro | listening | asking | analyzing | result | error
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [currentSymptom, setCurrentSymptom] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [chatLog, setChatLog] = useState([])
  const [retryCount, setRetryCount] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [useText, setUseText] = useState(false)
  const bottomRef = useRef(null)
  const introPlayedRef = useRef(false)
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const shouldStopRef = useRef(false)

  const addChat = (role, text) => setChatLog(prev => [...prev, { role, text, id: Date.now() + Math.random() }])

  const stopListeningAndSpeaking = () => {
    shouldStopRef.current = true
    window.speechSynthesis.cancel()
    setSpeaking(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current.abort()
      } catch(e) {}
    }
    setListening(false)
    isListeningRef.current = false
  }

  const sayAndLog = async (text) => {
    if (shouldStopRef.current) return
    addChat('ai', text)
    setSpeaking(true)
    await speak(text, lang)
    setSpeaking(false)
  }

  // Debug logging for state changes
  useEffect(() => {
    console.log('State change - Listening:', listening, 'Speaking:', speaking, 'Phase:', phase)
  }, [listening, speaking, phase])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chatLog, phase])

  // ── STEP 1: Intro ──
  useEffect(() => {
    if (phase !== 'intro') return
    if (introPlayedRef.current) return
    introPlayedRef.current = true
    shouldStopRef.current = false
    isListeningRef.current = false
    
    const greetings = {
      en: `Namaste ${user.name || 'friend'}! I am GramDoc AI health assistant.`,
      hi: `Namaste ${user.name || 'friend'}! Main GramDoc AI health assistant hoon.`,
      te: `Namaskaram ${user.name || 'friend'}! Nenu GramDoc AI health assistant ni.`
    }
    
    const questions = {
      en: `I will ask you a few questions about your health. Please speak clearly. What is your main health problem today?`,
      hi: `Main aapki takleef samajhne ke liye kuch sawaal puchhunga. Aaj aapko kaun si taklif hai?`,
      te: `Mee arogya samasya artham chesukovaniki kocchintaa. Nedu meeru elaanti samasya tho unnaru?`
    }
    
    const greeting = greetings[lang] || greetings.en
    const question = questions[lang] || questions.en
    
    setTimeout(async () => {
      await sayAndLog(greeting)
      await new Promise(r => setTimeout(r, 400))
      await sayAndLog(question)
      await new Promise(r => setTimeout(r, 1200))
      setPhase('listening')
    }, 800)
  }, [phase])

  // ── STEP 2: Listen for main symptom ──
  useEffect(() => {
    if (phase !== 'listening' || useText || isListeningRef.current) return
    isListeningRef.current = true
    shouldStopRef.current = false
    startListening()
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.abort()
        } catch(e) {}
      }
    }
  }, [phase, useText])

  async function startListening() {
    if (shouldStopRef.current || isListeningRef.current !== true) return
    // Small delay before listening starts
    await new Promise(r => setTimeout(r, 400))
    setListening(true)
    try {
      const heard = await listenOnce(lang, 20000)
      if (shouldStopRef.current) return
      setListening(false)
      setTranscript(heard)
      processSymptom(heard)
      isListeningRef.current = false
    } catch(e) {
      console.log('Start listening error:', e.message)
      if (shouldStopRef.current) return
      setListening(false)
      if (retryCount < 2) {
        setRetryCount(c => c+1)
        const msgs = { en: "I didn't catch that. Please speak again — what is your main problem?", hi: "Mujhe samajh nahi aaya. Phir se boliye — aapko kya taklif hai?", te: "Vinipincha ledu. Meeru maralaa cheppandi — mee mukhya samasya emiti?" }
        await sayAndLog(msgs[lang] || msgs.en)
        if (!shouldStopRef.current) {
          await new Promise(r => setTimeout(r, 800))
          startListening()
        }
      } else {
        isListeningRef.current = false
        setUseText(true)
        const msgs = { en: "I'm having trouble hearing you. Please type your symptoms below.", hi: "Aapki awaaz sun nahi pa raha. Neeche type karein.", te: "Mee matalu vinipincha ledu. Kruinda type cheyyandi." }
        await sayAndLog(msgs[lang] || msgs.en)
      }
    }
  }

  function processSymptom(text) {
    addChat('patient', text)
    const key = classifySymptom(text)
    if (!key) {
      const msgs = { en: "I understand you're not feeling well. Could you describe your problem more clearly? For example: fever, cough, stomach pain, headache, or chest pain?", hi: "Samajh aaya aap theek nahi hain. Thoda aur batayein — bukhar, khansi, pet dard, sar dard ya seene mein dard?", te: "Mee problem artham chesukunnanu. Konjam clear ga cheppagalara — jvaram, daggula, koota noppi, tala noppi ledaa rombe noppi?" }
      sayAndLog(msgs[lang] || msgs.en).then(() => { setPhase('listening'); setRetryCount(0) })
      return
    }
    setCurrentSymptom(key)
    setCurrentQ(0)
    setAnswers({})
    const tree = SYMPTOM_TREES[key]
    const acks = { en: `I understand, you have ${tree.label}. Let me ask you a few more questions to understand better.`, hi: `Samajh gaya, aapko ${tree.label} ki taklif hai. Main kuch sawaal aur puchhunga.`, te: `Artham aindi, meeru ${tree.label} tho baadha padutunnaru. Meeru inkaa kocchintaa sawaallu adugutaanu.` }
    sayAndLog(acks[lang] || acks.en).then(() => setPhase('asking'))
  }

  // ── STEP 3: Ask follow-up questions ──
  useEffect(() => {
    if (phase !== 'asking' || !currentSymptom) return
    const tree = SYMPTOM_TREES[currentSymptom]
    if (currentQ >= tree.questions.length) {
      setPhase('analyzing')
      return
    }
    const q = tree.questions[currentQ]
    const questionText = lang === 'hi' ? q.hi : lang === 'te' ? q.te : q.en
    sayAndLog(questionText).then(() => {
      setTimeout(() => askQuestion(q), 1400)
    })
  }, [phase, currentQ, currentSymptom])

  async function askQuestion(q) {
    if (useText || shouldStopRef.current) return
    // Small delay before listening
    await new Promise(r => setTimeout(r, 400))
    setListening(true)
    try {
      const heard = await listenOnce(lang, 20000)
      if (shouldStopRef.current) return
      setListening(false)
      isListeningRef.current = false
      addChat('patient', heard)
      setAnswers(prev => ({ ...prev, [q.id]: heard }))
      setCurrentQ(prev => prev + 1)
    } catch(e) {
      console.log('Ask question error:', e.message)
      if (shouldStopRef.current) return
      setListening(false)
      isListeningRef.current = false
      if (useText) return
      const msgs = { en: "Sorry, I didn't hear that. Please try speaking again.", hi: "Maafi kijiye, sunai nahi diya. Dobara boliye.", te: "Maafi cheyyandi, vinipincha ledu. Maralaa cheppandi." }
      await sayAndLog(msgs[lang] || msgs.en)
      if (!shouldStopRef.current) {
        await new Promise(r => setTimeout(r, 800))
        askQuestion(q)
      }
    }
  }

  function handleTextAnswer(value) {
    if (!value.trim() || !currentSymptom) return
    const tree = SYMPTOM_TREES[currentSymptom]
    if (phase === 'listening') {
      addChat('patient', value)
      setTextInput('')
      processSymptom(value)
      return
    }
    if (phase === 'asking' && currentQ < tree.questions.length) {
      const q = tree.questions[currentQ]
      addChat('patient', value)
      setAnswers(prev => ({ ...prev, [q.id]: value }))
      setTextInput('')
      const next = currentQ + 1
      if (next >= tree.questions.length) {
        setCurrentQ(next)
        setPhase('analyzing')
      } else {
        setCurrentQ(next)
      }
    }
  }

  // ── STEP 4: Analyze ──
  useEffect(() => {
    if (phase !== 'analyzing' || !currentSymptom) return
    const tree = SYMPTOM_TREES[currentSymptom]
    const analysis = tree.analyze(answers)
    const msgs = { en: 'Thank you. I am analyzing your symptoms now...', hi: 'Shukriya. Main aapke lakshan analyze kar raha hoon...', te: 'Dhanyavaadaalu. Meeru cheppina symptoms analyze chestaanu...' }
    sayAndLog(msgs[lang] || msgs.en).then(() => {
      setTimeout(() => {
        setResult(analysis)
        localStorage.setItem('gd_triage_summary', JSON.stringify({
          patientName: user.name || 'Patient',
          symptom: tree.label,
          answers,
          ...analysis,
          timestamp: new Date().toISOString()
        }))
        setPhase('result')
      }, 2000)
    })
  }, [phase, currentSymptom, answers])

  // ── STEP 5: Speak result ──
  useEffect(() => {
    if (phase !== 'result' || !result) return
    const urgencyMap = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH', critical: 'CRITICAL' }
    const msgs = {
      en: `Based on your symptoms, you likely have ${result.condition}. Urgency level is ${urgencyMap[result.urgency]}. I recommend you see a ${result.specialist}. ${result.urgency === 'high' || result.urgency === 'critical' ? 'Please seek medical help immediately!' : 'Please book a consultation with a doctor.'}`,
      hi: `Aapke lakshan ke hisab se aapko ${result.condition} lag raha hai. Yeh ${urgencyMap[result.urgency]} level hai. Aapko ${result.specialist} dikhana chahiye.`,
      te: `Mee symptoms batti, meeru ${result.condition} tho baadha padutunnaru. Ivvidi ${urgencyMap[result.urgency]} level. Meeru ${result.specialist} ni chupissukovaali.`
    }
    sayAndLog(msgs[lang] || msgs.en)
  }, [phase, result])

  const urgencyColors = { low: '#1d9e75', medium: '#ba7517', high: '#A32D2D', critical: '#6b0000' }
  const urgencyBg = { low: '#EAF3DE', medium: '#FEF3CD', high: '#FAECE7', critical: '#fce4e4' }

  return (
    <div style={{ maxWidth:700, margin:'0 auto', height:'calc(100vh - 110px)', display:'flex', flexDirection:'column', fontFamily:'Mukta,sans-serif' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ background:'#fff', borderRadius:16, padding:'14px 20px', marginBottom:14, border:'0.5px solid #e8d5bc', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background: listening ? '#A32D2D' : '#0f3d2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, animation: listening ? 'pulse 1s infinite' : 'none' }}>🎤</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#0f3d2a', fontFamily:'Fraunces,serif', fontStyle:'italic' }}>GramDoc AI</div>
            <div style={{ fontSize:10, color: listening ? '#A32D2D' : phase === 'result' ? '#1d9e75' : speaking ? '#ba7517' : '#6b5e50', fontWeight: listening ? 700 : 600 }}>
              {listening ? '🔴 LISTENING...' : phase === 'intro' ? '● Starting...' : phase === 'result' ? '● Analysis Complete' : speaking ? '● Speaking...' : phase === 'analyzing' ? '● Analyzing...' : '● Ready'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {(speaking || listening) && (
            <button onClick={stopListeningAndSpeaking} style={{ background: '#A32D2D', color:'#fff', border:'none', borderRadius:20, padding:'5px 12px', fontSize:10, fontWeight:600, cursor:'pointer', animation: 'pulse 1s infinite' }}>
              ⏹️ Tap to Stop
            </button>
          )}
          <button onClick={() => setUseText(t => !t)} style={{ background: useText ? '#0f3d2a' : '#f7f3ed', color: useText ? '#fff' : '#6b5e50', border:'0.5px solid #e8d5bc', borderRadius:20, padding:'5px 12px', fontSize:10, fontWeight:600, cursor:'pointer' }}>
            {useText ? '🎤 Switch to Voice' : '⌨️ Type Instead'}
          </button>
        </div>
      </div>

      {/* Waveform display - MORE PROMINENT */}
      <AnimatePresence>
        {(speaking || listening) && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ background: listening ? 'rgba(210, 45, 45, 0.15)' : '#0f3d2a', borderRadius:14, padding:'20px', marginBottom:14, display:'flex', flexDirection:'column', alignItems:'center', gap:12, border: listening ? '2px solid #A32D2D' : 'none' }}>
            <Waveform active={speaking || listening} />
            <div style={{ fontSize:16, color: listening ? '#A32D2D' : '#7bcaa4', fontWeight:700, textAlign: 'center', animation: listening ? 'pulse 1s infinite' : 'none' }}>
              {listening ? '🎤 LISTENING... Speak Now! 🎤' : '🔊 I am Speaking...'}
            </div>
            {listening && (
              <div style={{ fontSize:11, color: '#A32D2D', fontWeight: 600, textAlign: 'center' }}>
                Your voice is being recorded. Keep talking...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:12 }}>
        {listening && (
          <div style={{ background: '#A32D2D', color: '#fff', padding: '16px 12px', borderRadius: 12, marginBottom: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, animation: 'pulse 1s infinite', border: '2px solid #6b0000' }}>
            🎤 YOUR VOICE IS BEING LISTENED TO - SPEAK NOW! 🎤
          </div>
        )}
        <AnimatePresence>
          {chatLog.map(msg => (
            <motion.div key={msg.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
              style={{ display:'flex', justifyContent: msg.role === 'patient' ? 'flex-end' : 'flex-start', marginBottom:10 }}>
              {msg.role === 'ai' && (
                <div style={{ width:30, height:30, borderRadius:'50%', background:'#0f3d2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🩺</div>
              )}
              <div style={{ maxWidth:'75%', background: msg.role === 'patient' ? '#0f3d2a' : '#fff', color: msg.role === 'patient' ? '#fff' : '#1a3a2a', borderRadius: msg.role === 'patient' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding:'10px 14px', fontSize:13, lineHeight:1.6, border: msg.role === 'ai' ? '0.5px solid #e8d5bc' : undefined, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Analyzing animation */}
        {phase === 'analyzing' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', justifyContent:'center', padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 28px', textAlign:'center', border:'0.5px solid #e8d5bc' }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                style={{ width:40, height:40, border:'3px solid #e8d5bc', borderTop:'3px solid #0f3d2a', borderRadius:'50%', margin:'0 auto 12px' }}/>
              <div style={{ fontSize:13, color:'#0f3d2a', fontWeight:600 }}>Analyzing your symptoms...</div>
              <div style={{ fontSize:11, color:'#6b5e50', marginTop:4 }}>Using GramDoc AI health model</div>
            </div>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {phase === 'result' && result && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              style={{ background:'#fff', borderRadius:16, border:'0.5px solid #e8d5bc', padding:'20px', margin:'8px 0' }}>
              
              {/* Urgency banner */}
              <div style={{ background: urgencyBg[result.urgency], border:`1px solid ${urgencyColors[result.urgency]}30`, borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{result.urgency === 'high' || result.urgency === 'critical' ? '🚨' : result.urgency === 'medium' ? '⚠️' : '✅'}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color: urgencyColors[result.urgency], textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {result.urgency} urgency
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1a3a2a', marginTop:2 }}>{result.condition}</div>
                </div>
              </div>

              {/* Specialist */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'8px 12px', background:'#f7f3ed', borderRadius:8 }}>
                <span style={{ fontSize:16 }}>👨‍⚕️</span>
                <div>
                  <div style={{ fontSize:10, color:'#6b5e50', fontWeight:600 }}>RECOMMENDED SPECIALIST</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f3d2a' }}>{result.specialist}</div>
                </div>
              </div>

              {/* Medicines */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#6b5e50', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>💊 Suggested Medicines</div>
                {result.medicines.map((m,i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background:'#f7f3ed', borderRadius:8, marginBottom:6 }}>
                    <span style={{ color:'#0f3d2a', fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:12, color:'#1a3a2a' }}>{m}</span>
                  </div>
                ))}
                <div style={{ fontSize:10, color:'#A32D2D', marginTop:6, fontStyle:'italic' }}>⚠️ These are AI suggestions only. Always follow your doctor's prescription.</div>
              </div>

              {/* Doctor briefing */}
              <div style={{ background:'#EAF3DE', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:600, color:'#3B6D11', marginBottom:4 }}>📋 SUMMARY FOR DOCTOR</div>
                <div style={{ fontSize:12, color:'#1a3a2a', lineHeight:1.6 }}>{result.summary}</div>
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => nav('/app/doctors')}
                  style={{ flex:1, background:'#0f3d2a', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  👨‍⚕️ Find a Doctor Now →
                </button>
                <button onClick={() => { introPlayedRef.current = false; shouldStopRef.current = false; isListeningRef.current = false; setPhase('intro'); setChatLog([]); setResult(null); setCurrentSymptom(null); setCurrentQ(0); setAnswers({}); setRetryCount(0) }}
                  style={{ background:'#f7f3ed', color:'#0f3d2a', border:'1px solid #e8d5bc', borderRadius:10, padding:'12px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  🔄 New
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef}/>
      </div>

      {/* Input area */}
      {phase !== 'result' && (
        <div style={{ display:'flex', gap:8, background:'#fff', borderRadius:14, border:'0.5px solid #e8d5bc', padding:'8px 8px 8px 16px', alignItems:'center', marginTop:8 }}>
          <input value={textInput} onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextAnswer(textInput)}
            placeholder={listening ? '🎤 Listening... or type here' : 'Type your answer here...'}
            style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'#1a3a2a', background:'transparent', fontFamily:'Mukta,sans-serif' }} />
          <button onClick={() => handleTextAnswer(textInput)} disabled={!textInput.trim()}
            style={{ background: textInput.trim() ? '#0f3d2a' : '#e8d5bc', color:'#fff', border:'none', borderRadius:10, width:38, height:38, fontSize:16, cursor: textInput.trim() ? 'pointer' : 'default', flexShrink:0 }}>→</button>
        </div>
      )}

      {/* Quick symptom shortcuts */}
      {(phase === 'listening') && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
          {Object.entries(SYMPTOM_TREES).map(([key, tree]) => (
            <button key={key} onClick={() => { addChat('patient', tree.label); processSymptom(tree.label) }}
              style={{ background:'#fff', border:'0.5px solid #e8d5bc', borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:600, color:'#0f3d2a', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              {tree.icon} {tree.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
