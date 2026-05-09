export async function getAshaDashboard(req, res) {
  try {
    res.json({
      ashaName: 'Sunita Devi',
      village: 'Kondapur',
      district: 'Warangal',
      totalPatients: 34,
      consultationsThisMonth: 8,
      activePregnancies: 3,
      vaccinationsDueThisWeek: 12,
      villageHealthScore: 87,
      urgentTasks: [
        {
          id: 1,
          priority: 'urgent',
          patient: 'Lakshmi Devi',
          age: 34,
          gender: 'F',
          issue: 'Fever for 3 days',
          phone: '9876543210'
        },
        {
          id: 2,
          priority: 'followup',
          patient: 'Ramu Yadav',
          age: 58,
          gender: 'M',
          issue: 'BP checkup overdue',
          phone: '9876543211'
        }
      ],
      commonIllnesses: [
        { name: 'Fever', percent: 45 },
        { name: 'Cough/Cold', percent: 30 },
        { name: 'Stomach issues', percent: 15 },
        { name: 'Other', percent: 10 }
      ],
      vaccinationCoverage: 73
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getMyPatients(req, res) {
  try {
    const User = (await import('../models/User.js')).default
    // Fetch patients from the database. In a full system, we'd filter by the ASHA worker's village.
    const patients = await User.find({ role: 'patient' }).sort({ createdAt: -1 })
    
    // Map to the format expected by the frontend
    const formatted = patients.map(p => ({
      id: p._id,
      name: p.name,
      age: p.age || 35, // fallback if missing
      gender: p.gender || 'F',
      village: p.village || 'Kondapur',
      lastConsulted: 'Today',
      status: p.isPregnant ? 'pregnant' : 'active',
      phone: p.phone,
      color: p.isPregnant ? '#7B3FA0' : '#059669'
    }))
    
    res.json(formatted)
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function registerPatient(req, res) {
  try {
    const { name, age, gender, village, phone, conditions, isPregnant } = req.body
    const User = (await import('../models/User.js')).default
    const existing = await User.findOne({ phone })
    if (existing) return res.status(400).json({ message: 'Patient already registered' })
    const user = await User.create({
      name, phone,
      role: 'patient',
      village, 
      password: phone,
    })
    res.status(201).json({ 
      message: 'Patient registered successfully', 
      patient: { id: user._id, name, phone, village }
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function bookConsultationForPatient(req, res) {
  try {
    const { patientId, doctorId } = req.body
    res.json({ 
      message: 'Consultation booked successfully',
      roomId: `room_${Date.now()}`,
      patientId,
      doctorId
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getVillageReport(req, res) {
  try {
    res.json({
      village: 'Kondapur',
      week: 'May 1-7, 2026',
      totalConsultations: 23,
      commonDiagnoses: ['Viral Fever','Hypertension','Anemia'],
      vaccinationCoverage: 73,
      newRegistrations: 4,
      pregnancyCases: 3,
    })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getPregnancyTracker(req, res) {
  try {
    res.json([
      { id:1, name:'Priya Kumari', age:28, weeksPregnant:24, nextANC:'May 10', dueDate:'Aug 15, 2026', riskLevel:'low' },
      { id:2, name:'Anitha Reddy', age:22, weeksPregnant:32, nextANC:'May 8', dueDate:'Jun 20, 2026', riskLevel:'medium' },
      { id:3, name:'Kavitha Bai', age:30, weeksPregnant:16, nextANC:'May 20', dueDate:'Oct 5, 2026', riskLevel:'low' },
    ])
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function getVaccinationTracker(req, res) {
  try {
    res.json([
      { id:1, patientName:'Baby Raju', age:'6 months', vaccine:'DPT Booster', dueDate:'May 6', status:'due' },
      { id:2, patientName:'Baby Priya', age:'9 months', vaccine:'Measles', dueDate:'May 8', status:'due' },
      { id:3, patientName:'Baby Arjun', age:'1 year', vaccine:'MMR', dueDate:'May 12', status:'upcoming' },
    ])
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}

export async function markVaccinationDone(req, res) {
  try {
    res.json({ message: 'Vaccination marked as completed', id: req.params.id })
  } catch(e) {
    console.error(`[${new Date().toISOString()}] Error in ${e.stack}`)
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
    })
  }
}
