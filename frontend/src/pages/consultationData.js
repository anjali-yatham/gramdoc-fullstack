// consultationData.js — hardcoded patient data + helpers for Consultation page

export const COLORS = {
  forest: '#0f3d2a', mint: '#7bcaa4', terracotta: '#c4653a',
  cream: '#fdf6ec', sandstone: '#e8d5bc', warmGray: '#6b5e50',
  amber: '#854F0B', white: '#ffffff',
};

export const urgencyColor = (u) => {
  if (u === 'CRITICAL' || u === 'HIGH') return COLORS.terracotta;
  if (u === 'MEDIUM') return COLORS.amber;
  return COLORS.mint;
};

export const urgencyBg = (u) => {
  if (u === 'CRITICAL') return '#fde8e8';
  if (u === 'HIGH') return '#fff0e6';
  if (u === 'MEDIUM') return '#fff8e1';
  return '#e8f5ee';
};

export const statusColor = (s) => {
  if (s === 'sent') return COLORS.mint;
  if (s === 'active') return '#22c55e';
  return COLORS.amber;
};

export const genPatientId = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return 'GD-' + String(Math.abs(h) % 900000 + 100000);
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '??';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const daysAgoLabel = (d) => {
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
};

const today = new Date();
const dAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const PATIENTS = [
  {
    name: 'Padma Devi', age: 28, gender: 'Female', village: 'Bhupalpally', district: 'Warangal',
    bloodGroup: 'B+', ashaReferred: true, urgency: 'CRITICAL',
    symptom: 'Chest pain and breathlessness', lastVisit: '2 May 2026', status: 'Pending',
    date: 'Today',
    medicines: [], symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
    aiSummary: 'Patient presented with acute chest pain radiating to left arm. Consultation duration: 12 minutes. Key observations: Pain persisting since morning, no prior cardiac history. Recommended: Immediate ECG, rest, aspirin 75mg, follow-up within 24 hours. AI Confidence: 97%',
  },
  {
    name: 'Ramu Shetty', age: 55, gender: 'Male', village: 'Cherial', district: 'Siddipet',
    bloodGroup: 'O+', ashaReferred: false, urgency: 'HIGH',
    symptom: 'High fever and chills', lastVisit: '1 May 2026', status: 'Pending',
    date: 'Today',
    medicines: [], symptoms: ['High fever', 'Body aches', 'Fatigue'],
    aiSummary: 'Patient presented with high fever (103°F). Consultation duration: 10 minutes. Key observations: Fever persisting 2 days, no prior medication taken. Recommended: Paracetamol 500mg, rest, hydration, follow-up in 3 days. AI Confidence: 91%',
  },
  {
    name: 'Anita Singh', age: 35, gender: 'Female', village: 'Narsapur', district: 'Medak',
    bloodGroup: 'AB+', ashaReferred: true, urgency: 'LOW',
    symptom: 'Viral Fever', lastVisit: '30 Apr 2026', status: 'Prescription sent',
    date: 'Yesterday',
    medicines: [
      { name: 'Paracetamol 500mg', dosage: '1 tablet', duration: '5 days', timing: 'After food' },
      { name: 'Cetirizine 10mg', dosage: '1 tablet', duration: '3 days', timing: 'Before bed' },
      { name: 'ORS Sachet', dosage: '1 packet in 1L water', duration: '3 days', timing: 'Throughout day' },
    ],
    symptoms: ['Viral Fever', 'Runny nose', 'Mild cough'],
    aiSummary: 'Patient presented with viral fever. Consultation duration: 8 minutes. Key observations: Fever persisting 2 days, no prior medication taken. Recommended: Rest, hydration, follow-up in 5 days. AI Confidence: 94%',
  },
  {
    name: 'Suresh Kumar', age: 62, gender: 'Male', village: 'Jangaon', district: 'Jangaon',
    bloodGroup: 'A+', ashaReferred: false, urgency: 'MEDIUM',
    symptom: 'Hypertension', lastVisit: '30 Apr 2026', status: 'Prescription sent',
    date: 'Yesterday',
    medicines: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet', duration: '30 days', timing: 'Morning' },
      { name: 'Aspirin 75mg', dosage: '1 tablet', duration: '30 days', timing: 'After food' },
    ],
    symptoms: ['Hypertension', 'Headache', 'Fatigue'],
    aiSummary: 'Patient presented with elevated blood pressure (160/100). Consultation duration: 15 minutes. Key observations: Irregular medication adherence, high salt diet. Recommended: Amlodipine, lifestyle modification, follow-up in 7 days. AI Confidence: 88%',
  },
  {
    name: 'Fatima Bi', age: 38, gender: 'Female', village: 'Mahabubabad', district: 'Mahabubabad',
    bloodGroup: 'B-', ashaReferred: true, urgency: 'LOW',
    symptom: 'Skin allergy', lastVisit: '29 Apr 2026', status: 'Pending',
    date: '2 days ago',
    medicines: [], symptoms: ['Skin allergy', 'Itching', 'Rash'],
    aiSummary: 'Patient presented with skin allergy on forearms. Consultation duration: 7 minutes. Key observations: Allergic reaction likely from detergent. Recommended: Antihistamines, topical cream, avoid irritant. AI Confidence: 92%',
  },
  {
    name: 'Meera Kumari', age: 7, gender: 'Female', village: 'Bhupalpally', district: 'Warangal',
    bloodGroup: 'O+', ashaReferred: true, urgency: 'MEDIUM',
    symptom: 'Child fever and vomiting', lastVisit: '28 Apr 2026', status: 'Pending',
    date: '3 days ago',
    medicines: [], symptoms: ['Child fever', 'Loss of appetite', 'Irritability'],
    aiSummary: 'Pediatric patient presented with fever (101°F). Consultation duration: 11 minutes. Key observations: Fever for 1 day, mild dehydration. Recommended: Pediatric paracetamol syrup, fluids, monitor temperature. AI Confidence: 90%',
  },
];
