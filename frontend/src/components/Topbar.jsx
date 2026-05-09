import { useLocation } from 'react-router-dom'

const meta = {
  '/app': { title: 'Dashboard', badge: 'Overview' },
  '/app/voice-triage': { title: 'AI Triage Chat', badge: 'AI Assistant' },
  '/app/triage': { title: 'AI Triage Chat', badge: 'Assistant' },
  '/app/doctors': { title: 'Find Doctors', badge: 'Available Now' },
  '/app/doctors-confirm': { title: 'Doctor Confirmation', badge: 'Appointment' },
  '/app/consultation': { title: 'Consultation', badge: 'Live' },
  '/app/consultation/call': { title: 'Video Consultation', badge: 'Live Call' },
  '/app/prescriptions': { title: 'Prescriptions', badge: 'Digital Rx' },
  '/app/schedule': { title: 'My Schedule', badge: 'Today' },
  '/app/doctor-dashboard': { title: 'Doctor Dashboard', badge: 'Live' },
  '/app/village-reports': { title: 'Analytics', badge: 'Live Data' },
  '/app/profile': { title: 'My Profile', badge: 'Doctor' },
  '/app/patient-profile': { title: 'My Profile', badge: 'Patient' },
  '/app/asha': { title: 'ASHA Dashboard', badge: 'Village Health' },
  '/app/asha-dashboard': { title: 'ASHA Dashboard', badge: 'Village Health' },
  '/app/asha-register': { title: 'Register Patient', badge: 'ASHA' },
  '/app/asha-pregnancy': { title: 'Pregnancy Tracker', badge: 'ASHA' },
  '/app/asha-patients': { title: 'My Patients', badge: 'ASHA' },
  '/app/asha-vaccination': { title: 'Vaccination Tracker', badge: 'ASHA' },
  '/app/asha-report': { title: 'Village Report', badge: 'ASHA' },
}



export default function Topbar() {
  const { pathname } = useLocation()

  const page = meta[pathname] || { title: 'GramDoc', badge: '' }

  return (
    <header style={{
      background: '#fff', borderBottom: '0.5px solid var(--sandstone)',
      padding: '0 28px', height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--forest)', fontWeight: 600 }}>
          {page.title}
        </span>
        {page.badge && (
          <span style={{ background: 'var(--mint-pale)', color: '#3B6D11', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
            {page.badge}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* Notifications */}
        <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand)', borderRadius: '50%', cursor: 'pointer' }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: 'var(--terracotta)', borderRadius: '50%', border: '1.5px solid #fff' }} />
        </div>
      </div>
    </header>
  )
}
