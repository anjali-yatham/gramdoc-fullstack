// Dynamic TF loading to reduce initial bundle size
async function loadTF() {
  return await import('@tensorflow/tfjs')
}

// Symptom keywords mapped to diseases
const SYMPTOM_DISEASE_MAP = {
  fever: ['viral_fever', 'malaria', 'typhoid', 'dengue'],
  headache: ['viral_fever', 'migraine', 'hypertension', 'stress'],
  cough: ['cold', 'bronchitis', 'asthma', 'tuberculosis'],
  cold: ['viral_fever', 'allergy', 'sinusitis'],
  vomiting: ['food_poisoning', 'gastritis', 'viral_fever', 'appendicitis'],
  stomach_pain: ['gastritis', 'appendicitis', 'food_poisoning', 'ulcer'],
  chest_pain: ['heart_attack', 'angina', 'gas', 'muscle_strain'],
  breathless: ['asthma', 'heart_failure', 'anemia', 'anxiety'],
  eye_pain: ['conjunctivitis', 'glaucoma', 'eye_strain', 'infection'],
  ear_pain: ['ear_infection', 'wax_buildup', 'sinusitis'],
  skin_rash: ['allergy', 'chickenpox', 'fungal', 'eczema'],
  weakness: ['anemia', 'diabetes', 'malnutrition', 'viral_fever'],
  joint_pain: ['arthritis', 'viral_fever', 'injury', 'gout'],
  back_pain: ['muscle_strain', 'kidney_stone', 'slip_disc', 'injury'],
  dizziness: ['bp_low', 'anemia', 'ear_issue', 'dehydration'],
  child_fever: ['viral_fever', 'malaria', 'ear_infection', 'teething'],
  pregnancy: ['normal_pregnancy', 'complication', 'preeclampsia'],
  bleeding: ['injury', 'hemorrhoids', 'ulcer', 'internal_bleeding'],
  burning_urine: ['uti', 'kidney_stone', 'std'],
    diabetes_symptoms: ['diabetes', 'pre_diabetes', 'kidney_issue'],
    menstrual: ['menstrual_cramps', 'dysmenorrhea'],
    late_periods: ['pcos', 'irregular_periods']
  }

const DISEASE_DISPLAY = {
  viral_fever: { name: 'Viral Fever', urgency: 'medium', color: '#854F0B', doctor: 'General Physician' },
  malaria: { name: 'Malaria', urgency: 'high', color: '#A32D2D', doctor: 'General Physician' },
  typhoid: { name: 'Typhoid', urgency: 'high', color: '#A32D2D', doctor: 'General Physician' },
  dengue: { name: 'Dengue', urgency: 'high', color: '#A32D2D', doctor: 'General Physician' },
  migraine: { name: 'Migraine', urgency: 'medium', color: '#854F0B', doctor: 'Neurologist' },
  hypertension: { name: 'Hypertension', urgency: 'medium', color: '#854F0B', doctor: 'Cardiologist' },
  cold: { name: 'Common Cold', urgency: 'low', color: '#27500A', doctor: 'General Physician' },
  bronchitis: { name: 'Bronchitis', urgency: 'medium', color: '#854F0B', doctor: 'Pulmonologist' },
  asthma: { name: 'Asthma', urgency: 'high', color: '#A32D2D', doctor: 'Pulmonologist' },
  food_poisoning: { name: 'Food Poisoning', urgency: 'medium', color: '#854F0B', doctor: 'Gastroenterologist' },
  gastritis: { name: 'Gastritis', urgency: 'low', color: '#27500A', doctor: 'Gastroenterologist' },
  appendicitis: { name: 'Appendicitis', urgency: 'high', color: '#A32D2D', doctor: 'General Surgeon' },
  heart_attack: { name: 'Heart Attack', urgency: 'high', color: '#A32D2D', doctor: 'Cardiologist' },
  conjunctivitis: { name: 'Eye Infection', urgency: 'low', color: '#27500A', doctor: 'Ophthalmologist' },
  ear_infection: { name: 'Ear Infection', urgency: 'medium', color: '#854F0B', doctor: 'ENT Specialist' },
  allergy: { name: 'Allergy', urgency: 'low', color: '#27500A', doctor: 'General Physician' },
  anemia: { name: 'Anemia', urgency: 'medium', color: '#854F0B', doctor: 'General Physician' },
  arthritis: { name: 'Arthritis', urgency: 'low', color: '#27500A', doctor: 'Orthopedic' },
  kidney_stone: { name: 'Kidney Stone', urgency: 'high', color: '#A32D2D', doctor: 'Urologist' },
  uti: { name: 'UTI', urgency: 'medium', color: '#854F0B', doctor: 'Urologist' },
  diabetes: { name: 'Diabetes', urgency: 'medium', color: '#854F0B', doctor: 'Endocrinologist' },
  menstrual_cramps: { name: 'Menstrual Cramps', urgency: 'low', color: '#27500A', doctor: 'Gynecologist' },
  pcos: { name: 'PCOS/PCOD', urgency: 'medium', color: '#854F0B', doctor: 'Gynecologist' },
  dysmenorrhea: { name: 'Severe Period Pain', urgency: 'medium', color: '#854F0B', doctor: 'Gynecologist' },
  irregular_periods: { name: 'Irregular Periods', urgency: 'medium', color: '#854F0B', doctor: 'Gynecologist' }
}

// Extract symptoms from spoken text
export const extractSymptoms = (text) => {
  const lower = text.toLowerCase()
  const found = []
  
  const keywords = {
    fever: ['fever', 'bukhar', 'jwaram', 'temperature', 'hot', 'बुखार', 'ताप', 'జ్వరం'],
    headache: ['headache', 'head pain', 'sir dard', 'tala noppi', 'सिर दर्द', 'सिर में दर्द', 'తల నొప్పి'],
    cough: ['cough', 'khansi', 'coughing', 'खांसी', 'దగ్గు'],
    cold: ['cold', 'sardi', 'runny nose', 'sneezing', 'सर्दी', 'जुकाम', 'జలుబు'],
    vomiting: ['vomit', 'ulti', 'vanti', 'nausea', 'sick', 'उल्टी', 'వాంతి'],
    stomach_pain: ['stomach', 'abdomen', 'pet dard', 'belly', 'पेट दर्द', 'కడుపు నొప్పి'],
    chest_pain: ['chest', 'seena', 'heart', 'सीने में दर्द', 'छाती में दर्द', 'గుండె నొప్పి'],
    breathless: ['breath', 'breathing', 'saans', 'suffocating', 'सांस फूलना', 'ఊపిరి ఆడకపోవడం'],
    eye_pain: ['eye', 'aankhein', 'aankh', 'vision', 'sight', 'आंख', 'आंखों में दर्द', 'కన్ను'],
    ear_pain: ['ear', 'kaan', 'hearing', 'कान में दर्द', 'చెవి నొప్పి'],
    skin_rash: ['rash', 'itching', 'khujli', 'skin', 'खुजली', 'चक्कते', 'దురద'],
    weakness: ['weak', 'kamzori', 'tired', 'fatigue', 'कमजोरी', 'थकान', 'నీరసం'],
    joint_pain: ['joint', 'knee', 'ghutna', 'bone', 'घुटने में दर्द', 'जोड़ों का दर्द', 'కీళ్ల నొప్పులు'],
    back_pain: ['back', 'peeth', 'spine', 'पीठ में दर्द', 'వెన్ను నొప్పి'],
    dizziness: ['dizzy', 'chakkar', 'faint', 'चक्कर', 'తల తిరగడం'],
    child_fever: ['child', 'baby', 'infant', 'baccha', 'बच्चा', 'शिशु', 'పిల్లలు'],
    pregnancy: ['pregnant', 'pregnancy', 'गर्भवती', 'गर्भावस्था', 'గర్భం'],
    bleeding: ['blood', 'bleeding', 'khoon', 'रक्त', 'खून', 'రక్తం'],
    burning_urine: ['urine', 'peshab', 'burning urine', 'पेशाब में जलन', 'మూత్రంలో మంట'],
    diabetes_symptoms: ['sugar', 'diabetes', 'thirst', 'मधुमेह', 'చక్కెర వ్యాధి'],
    menstrual: ['period', 'periods', 'menstrual', 'menses', 'monthly', 'मासिक धर्म', 'पीरियड्स', 'నెలసరి'],
    late_periods: ['late', 'delayed', 'missed', 'irregular', 'देरी', 'ఆలస్యం']
  }
  
  for (const [symptom, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) {
      found.push(symptom)
    }
  }
  
  return found
}

// Calculate disease probabilities using TF.js tensor operations
export const analyzeSymptomsML = async (symptoms) => {
  if (symptoms.length === 0) return []
  
  const tf = await loadTF()
  
  // Build disease score tensor
  const allDiseases = Object.keys(DISEASE_DISPLAY)
  const scores = {}
  
  allDiseases.forEach(d => { scores[d] = 0 })
  
  symptoms.forEach(symptom => {
    const relatedDiseases = SYMPTOM_DISEASE_MAP[symptom] || []
    relatedDiseases.forEach((disease, index) => {
      if (scores[disease] !== undefined) {
        // Higher score for primary matches (index 0)
        scores[disease] += (relatedDiseases.length - index) * 10
      }
    })
  })
  
  // Use TF.js for normalization
  const scoreValues = allDiseases.map(d => scores[d])
  const tensor = tf.tensor1d(scoreValues)
  const softmax = tf.softmax(tensor)
  const probabilities = softmax.arraySync()
  
  // Build results
  const results = allDiseases
    .map((disease, i) => ({
      disease,
      probability: probabilities[i],
      ...DISEASE_DISPLAY[disease]
    }))
    .filter(r => r.probability > 0.02)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 4)
  
  // Cleanup tensors
  tensor.dispose()
  softmax.dispose()
  
  return results
}

export const getMLUrgency = (results) => {
  if (results.length === 0) return 'low'
  const top = results[0]
  return top.urgency || 'medium'
}
