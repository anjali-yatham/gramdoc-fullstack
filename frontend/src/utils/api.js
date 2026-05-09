const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export const safeParse = (str, fallback = {}) => {
  try { 
    if (!str) return fallback
    const data = typeof str === 'string' ? JSON.parse(str) : str
    return data || fallback
  }
  catch (e) { 
    console.warn('safeParse failed:', e, 'Input:', str)
    return fallback 
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('gramdoc_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server error — please try again')
  }

  let data
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : {}
  } catch (e) {
    console.error('API Parse Error:', e, 'Raw response:', text)
    throw new Error('Invalid response from server')
  }

  if (!res.ok) throw new Error(data.message || data.error || 'Request failed')
  return data
}

export async function fetchWithFallback(apiCall, localKey, fallback) {
  try {
    const data = await apiCall()
    localStorage.setItem(localKey, JSON.stringify(data))
    return data
  } catch(e) {
    console.warn(`API call failed for ${localKey}, using fallback.`, e)
    const cached = localStorage.getItem(localKey)
    return safeParse(cached, fallback)
  }
}

export async function dualSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
  try {
    const token = localStorage.getItem('gramdoc_token')
    if (!token) return;
    const res = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ key, data })
    })
    if (!res.ok) {
      console.warn(`Sync failed for ${key}: ${res.status}`)
    }
  } catch(e) { 
    console.log(`Sync deferred for ${key}. Error:`, e.message)
    const queue = safeParse(localStorage.getItem('gd_offline_sync'), [])
    queue.push({ key, data, ts: Date.now() })
    localStorage.setItem('gd_offline_sync', JSON.stringify(queue.slice(-50))) // Keep last 50
  }
}

export async function dualLoad(key, fallback = []) {
  try {
    const token = localStorage.getItem('gramdoc_token')
    if (!token) throw new Error('No token');
    const res = await fetch(`${BASE}/sync/${key}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (data) {
        localStorage.setItem(key, JSON.stringify(data))
        return data
      }
    } else {
      console.warn(`Sync load failed for ${key} with status ${res.status}`)
    }
  } catch(e) {
    console.error(`dualLoad error for ${key}:`, e)
  }
  const cached = localStorage.getItem(key)
  return safeParse(cached, fallback)
}

export const api = {
  // Auth (DO NOT CHANGE)
  sendOtp: (phone, role, name) => 
    request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, role, name }) }),
  verifyOtp: (phone, otp) => 
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  loginEmail: (email, password) => 
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (data) => 
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  doctorApply: (data) => 
    request('/auth/doctor-apply', { method: 'POST', body: JSON.stringify(data) }),
  pharmacyApply: (data) =>
    request('/auth/pharmacy-apply', { method: 'POST', body: JSON.stringify(data) }),

  // Doctors
  getDoctors: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchWithFallback(
      () => request(`/doctors${params ? `?${params}` : ''}`),
      'gd_doctors',
      []
    )
  },
  updateDoctor: (id, data) =>
    request(`/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  toggleAvailability: (isAvailable) =>
    fetchWithFallback(
      () => request('/doctors/availability', {
        method: 'POST',
        body: JSON.stringify({ isAvailable })
      }),
      'gd_doctor_availability',
      { isAvailable }
    ),

  saveSchedule: (schedule) =>
    fetchWithFallback(
      () => request('/doctors/schedule', {
        method: 'POST',
        body: JSON.stringify(schedule)
      }),
      'gd_doctor_schedule',
      schedule
    ),

  verifyDoctor: (regNumber) => 
    request('/doctors/verify', { 
      method: 'POST', 
      body: JSON.stringify({ regNumber }) 
    }),
  getSchedule: () => 
    fetchWithFallback(
      () => request('/doctors/schedule'),
      'gd_doctor_schedule',
      {}
    ),

  // Consultations
  startConsultation: (doctorId) => 
    fetchWithFallback(
      () => request('/consultations/start', { method: 'POST', body: JSON.stringify({ doctorId }) }),
      'gd_active_patient',
      {}
    ),
  
  endConsultation: (id) => 
    fetchWithFallback(
      () => request(`/consultations/${id}/end`, { method: 'POST' }),
      'gd_last_consultation_status',
      { status: 'ended' }
    ),

  getConsultations: () =>
    request('/consultations'),

  getQueue: async () => {
    let data = []
    try {
      data = await request('/consultations/queue')
      localStorage.setItem('gd_offline_queue', JSON.stringify(data))
    } catch (e) {
      const cached = localStorage.getItem('gd_offline_queue')
      if (cached) {
        try { data = JSON.parse(cached) } catch(_) { data = [] }
      }
    }
    
    let result = Array.isArray(data) ? data : []

    // Deduplicate by name to prevent duplicate entries
    if (result.length > 0) {
      result = result.filter((v, i, a) => {
        const vName = v.name || (v.patient && v.patient.name)
        return a.findIndex(t => {
          const tName = t.name || (t.patient && t.patient.name)
          return tName === vName
        }) === i
      })
      localStorage.setItem('gd_offline_queue', JSON.stringify(result))
    }
    return result
  },
  
  searchPatients: (q) => request(`/consultations/search?q=${encodeURIComponent(q)}`),
  saveQueue: (queue) => 
    request('/consultations/queue', { 
      method: 'POST', 
      body: JSON.stringify({ queue }) 
    }),

  // Prescriptions
  savePrescription: (data) =>
    request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getPrescriptionHistory: () => 
    fetchWithFallback(
      () => request('/prescriptions'),
      'gd_prescription_history',
      []
    ),

  // Analytics & Earnings
  getEarnings: () => 
    fetchWithFallback(
      () => request('/doctors/earnings'),
      'gd_earnings',
      {}
    ),

  getAnalytics: () => 
    fetchWithFallback(
      () => request('/doctors/analytics'),
      'gd_analytics',
      {}
    ),

  // Triage
  // Triage needs real-time responses; do not swallow errors with fallback.
  triageChat: (messages) =>
    request('/triage/chat', { method: 'POST', body: JSON.stringify({ messages }) }),

  // Dashboard
  getDashboard: () => 
    fetchWithFallback(
      () => request('/dashboard/stats'),
      'gd_dashboard',
      {}
    ),

  // ASHA Worker
  getPregnancyTracker: () =>
    fetchWithFallback(
      () => request('/asha/pregnancy-tracker'),
      'gd_asha_pregnancy',
      []
    ),
  registerPatientForAsha: (data) =>
    fetchWithFallback(
      () => request('/asha/register-patient', { method: 'POST', body: JSON.stringify(data) }),
      'gd_asha_last_registered',
      {}
    ),
  getVaccinationTracker: () =>
    fetchWithFallback(
      () => request('/asha/vaccination-tracker'),
      'gd_asha_vaccination',
      []
    ),
  getVillageReport: () =>
    fetchWithFallback(
      () => request('/asha/village-report'),
      'gd_asha_village_report',
      {}
    ),
  getPatientsForAsha: () =>
    fetchWithFallback(
      () => request('/asha/my-patients'),
      'gd_asha_patients',
      []
    ),
  markVaccinationDone: (id) =>
    fetchWithFallback(
      () => request(`/asha/vaccination/${id}/done`, { method: 'POST' }),
      'gd_asha_last_vaccination_update',
      {}
    ),

  // Optional: Village report send (backend must support)
  sendVillageReportToPHC: () =>
    request('/asha/village-report/send', { method: 'POST' }),

  // Helpers
  getUser: () => safeParse(localStorage.getItem('gramdoc_user'), {}),
}
