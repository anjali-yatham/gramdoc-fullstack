import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

// Lazy loaded pages
const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const LanguageSelect = lazy(() => import('./pages/LanguageSelect'))
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'))
const Triage = lazy(() => import('./pages/Triage'))
const Doctors = lazy(() => import('./pages/Doctors'))
const DoctorConfirm = lazy(() => import('./pages/DoctorConfirm'))
const Consultation = lazy(() => import('./pages/Consultation'))
const ConsultationCall = lazy(() => import('./pages/ConsultationCall'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const Pending = lazy(() => import('./pages/Pending'))
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const VoiceTriage = lazy(() => import('./pages/VoiceTriage'))
const PatientProfile = lazy(() => import('./pages/PatientProfile'))
const Profile = lazy(() => import('./pages/Profile'))
const VillageReports = lazy(() => import('./pages/VillageReports'))
const Schedule = lazy(() => import('./pages/Schedule'))
const AshaWorkerDashboard = lazy(() => import('./pages/AshaWorkerDashboard'))
const AshaRegisterPatient = lazy(() => import('./pages/AshaRegisterPatient'))
const AshaPregnancyTracker = lazy(() => import('./pages/AshaPregnancyTracker'))
const AshaPatients = lazy(() => import('./pages/AshaPatients'))
const AshaVaccinationTracker = lazy(() => import('./pages/AshaVaccinationTracker'))
const AshaVillageReport = lazy(() => import('./pages/AshaVillageReport'))
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard'))

function RoleBasedDashboard() {
  const user = JSON.parse(localStorage.getItem('gramdoc_user') || '{}')
  if (user?.role === 'doctor') return <DoctorDashboard />
  if (user?.role === 'asha') return <AshaWorkerDashboard />
  return <PatientDashboard />
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f3d2a',
      gap: 16
    }}>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontStyle: 'italic',
        fontSize: 32,
        color: '#fff',
        fontWeight: 600
      }}>GramDoc</div>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(123,202,164,0.3)',
        borderTop: '3px solid #7bcaa4',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/language" element={<LanguageSelect />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<RoleBasedDashboard />} />
            <Route path="triage" element={<Triage />} />
            <Route path="doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="voice-triage" element={<VoiceTriage />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors-confirm" element={<DoctorConfirm />} />
            <Route path="consultation" element={<Consultation />} />
            <Route path="consultation/call" element={<ConsultationCall />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="profile" element={<Profile />} />
            <Route path="patient-profile" element={<PatientProfile />} />
            <Route path="village-reports" element={<VillageReports />} />
            <Route path="asha" element={<AshaWorkerDashboard />} />
            <Route path="asha-dashboard" element={<AshaWorkerDashboard />} />
            <Route path="asha-register" element={<AshaRegisterPatient />} />
            <Route path="asha-pregnancy" element={<AshaPregnancyTracker />} />
            <Route path="asha-patients" element={<AshaPatients />} />
            <Route path="asha-vaccination" element={<AshaVaccinationTracker />} />
            <Route path="asha-report" element={<AshaVillageReport />} />
            <Route path="pharmacy-dashboard" element={<PharmacyDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to={
            localStorage.getItem('gramdoc_token') 
            ? '/app' 
            : '/'
          } replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  )
}
