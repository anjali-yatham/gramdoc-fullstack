export const SPECIALTY_MAP = {
  neurologist: ['Neurologist', 'General Physician', 'General Medicine'],
  cardiologist: ['Cardiologist', 'General Physician'],
  pediatrician: ['Pediatrician', 'General Physician'],
  gynecologist: ['Gynaecologist', 'General Physician'],
  gynaecologist: ['Gynaecologist', 'General Physician'],
  dermatologist: ['Dermatologist', 'General Physician'],
  orthopedician: ['Orthopedician', 'General Medicine'],
  ent: ['ENT Specialist', 'General Physician'],
  general: ['General Physician', 'General Medicine'],
  physician: ['General Physician', 'General Medicine'],
  ophthalmologist: ['General Physician'],
  urologist: ['General Physician'],
  psychiatrist: ['General Physician'],
}

export const getMatchingSpecs = (recommended) => {
  if (!recommended) return ['General Physician', 'General Medicine']
  const lower = recommended.toLowerCase()
  for (const [key, specs] of Object.entries(SPECIALTY_MAP)) {
    if (lower.includes(key)) return specs
  }
  return ['General Physician', 'General Medicine']
}

export const DISEASE_MEDICINE_MAP = {
  'fever': [
    { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times a day', timing: 'After food', duration: '3', durationUnit: 'Days' },
    { name: 'Pantoprazole 40mg', dosage: '1 tablet', frequency: 'Once a day', timing: 'Before food', duration: '3', durationUnit: 'Days' }
  ],
  'headache': [
    { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'As needed (SOS)', timing: 'After food', duration: '2', durationUnit: 'Days' }
  ],
  'cough': [
    { name: 'Cough Syrup', dosage: '10ml', frequency: 'Three times a day', timing: 'After food', duration: '5', durationUnit: 'Days' },
    { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Night (9PM - 11PM)', timing: 'After food', duration: '5', durationUnit: 'Days' }
  ],
  'stomach': [
    { name: 'Digene Tablet', dosage: '2 tablets', frequency: 'As needed (SOS)', timing: 'After food', duration: '3', durationUnit: 'Days' },
    { name: 'ORS Powder', dosage: '1 sachet', frequency: 'As needed (SOS)', timing: 'With food', duration: '2', durationUnit: 'Days' }
  ],
  'skin': [
    { name: 'Betadine Ointment', dosage: 'Apply thin layer', frequency: 'Twice a day', timing: 'With food', duration: '7', durationUnit: 'Days' },
    { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Night (9PM - 11PM)', timing: 'After food', duration: '5', durationUnit: 'Days' }
  ],
  'infection': [
    { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Three times a day', timing: 'After food', duration: '5', durationUnit: 'Days' }
  ],
  'periods': [
    { name: 'Meftal-Spas', dosage: '1 tablet', frequency: 'As needed (SOS)', timing: 'After food', duration: '3', durationUnit: 'Days' },
    { name: 'Hot Water Bag', dosage: 'Local application', frequency: 'Twice a day', timing: 'Throughout day', duration: '3', durationUnit: 'Days' }
  ],
  'menstrual': [
    { name: 'Meftal-Spas', dosage: '1 tablet', frequency: 'As needed (SOS)', timing: 'After food', duration: '3', durationUnit: 'Days' }
  ]
}

export const getSuggestedMedicines = (diagnosis = '') => {
  const lower = diagnosis.toLowerCase()
  for (const [key, meds] of Object.entries(DISEASE_MEDICINE_MAP)) {
    if (lower.includes(key)) return meds
  }
  return []
}
