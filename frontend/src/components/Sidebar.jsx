import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/api'
import { LANGS } from '../utils/translations'

// --- SVG ICONS ---
const Icons = {
  stethoscope: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a2 2 0 0 0-2 2v12a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2 .3.3 0 1 0 .2.3"/><path d="M9 4.2V12"/><path d="M15 4.2V12"/><path d="M12 21a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2 .3.3 0 1 0 .2.3"/><circle cx="12" cy="18" r="3"/></svg>,
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  queue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  prescription: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const user = api.getUser() || {}
  const langKey = localStorage.getItem('gramdoc_lang') || 'en'
  const t = LANGS[langKey]?.ui || {}
  const isDoc = user.role === 'doctor'
  const isAsha = user.role === 'asha'
  const isPharmacy = user.role === 'pharmacy'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const doctorNav = [
    {
      section: 'PRACTICE',
      links: [
        { to: '/app/doctor-dashboard', icon: Icons.dashboard, label: 'Dashboard' },
        { to: '/app/consultation', icon: Icons.video, label: 'Consultation' },
        { to: '/app/schedule', icon: Icons.calendar, label: 'Schedule' },
      ]
    },
    {
      section: 'RECORDS',
      links: [
        { to: '/app/prescriptions', icon: Icons.prescription, label: 'Prescriptions' },
        { to: '/app/village-reports', icon: Icons.analytics, label: 'Analytics' },
        { to: '/app/profile', icon: Icons.profile, label: 'My Profile' },
      ]
    }
  ]

  const patientNav = [
    {
      section: langKey === 'te' ? 'ప్రధానం' : langKey === 'hi' ? 'मुख्य' : 'MAIN',
      links: [
        { to: '/app', icon: '🏠', label: t.dashboard || 'Dashboard' },
        { to: '/app/voice-triage', icon: '🤖', label: t.aiTriage || 'AI Triage' },
        { to: '/app/doctors', icon: '👨‍⚕️', label: t.findDoctors || 'Find Doctors' },
        { to: '/app/prescriptions', icon: '💊', label: t.prescriptions || 'Prescriptions' },
      ]
    },
    {
      section: langKey === 'te' ? 'నా ఆరోగ్యం' : langKey === 'hi' ? 'मेरा स्वास्थ्य' : 'MY HEALTH',
      links: [
        { to: '/app/patient-profile', icon: '👤', label: t.myProfile || 'My Profile' },
      ]
    }
  ]

  const ashaNav = [
    {
      section: 'VILLAGE HEALTH',
      links: [
        { to: '/app/asha', icon: '🏠', label: 'My Dashboard' },
        { to: '/app/asha-patients', icon: '👥', label: 'My Patients' },
        { to: '/app/asha-register', icon: '➕', label: 'Register Patient' },
      ]
    },
    {
      section: 'TRACKERS',
      links: [
        { to: '/app/asha-pregnancy', icon: '🤰', label: 'Pregnancy Tracker' },
        { to: '/app/asha-vaccination', icon: '💉', label: 'Vaccination Tracker' },
        { to: '/app/asha-accountability', icon: '🎯', label: 'Accountability' },
        { to: '/app/asha-report', icon: '📊', label: 'Village Report' },
      ]
    }
  ]

  const pharmacyNav = [
    {
      section: 'PHARMACY',
      links: [
        { to: '/app/pharmacy-dashboard', icon: '🏠', label: 'Dashboard' },
        { to: '/app/pharmacy-orders', icon: '📦', label: 'Orders' },
        { to: '/app/pharmacy-inventory', icon: '💊', label: 'Inventory' },
        { to: '/app/pharmacy-earnings', icon: '💰', label: 'Earnings' },
        { to: '/app/pharmacy-profile', icon: '👤', label: 'Profile' },
      ]
    }
  ]

  let nav = patientNav
  if (user.role === 'doctor') nav = doctorNav
  else if (user.role === 'asha') nav = ashaNav
  else if (user.role === 'pharmacy') nav = pharmacyNav

  return (
    <aside style={{
      width: 228, minWidth: 228, height: '100vh',
      background: '#0f3d2a', display: 'flex', flexDirection: 'column', flexShrink: 0,
      zIndex: 1000, position: 'relative'
    }}>
      {/* Brand */}
      <div 
        onClick={() => {
          if (user.role === 'doctor') navigate('/app/doctor-dashboard');
          else if (user.role === 'asha') navigate('/app/asha');
          else if (user.role === 'pharmacy') navigate('/app/pharmacy-dashboard');
          else navigate('/app');
        }}
        style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7bcaa4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f3d2a' }}>
            {Icons.stethoscope}
          </div>
          <div>
            <div style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 22, color: '#fff', fontWeight: 600, lineHeight: 1 }}>
              GramDoc
            </div>
            <div style={{ fontSize: 10, color: '#6b5e50', marginTop: 3 }}>
              Rural Telemedicine
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {nav.map(({ section, links }) => (
          <div key={section}>
            <div style={{ fontSize: 10, color: '#6b5e50', padding: '16px 22px 6px', letterSpacing: '0.1em', fontWeight: 700 }}>
              {section}
            </div>
            {links.map(link => {
              const isActive = location.pathname === link.to || (link.to.includes('#') && location.pathname + location.hash === link.to)
              
              if (link.soon) {
                return (
                  <div key={link.label} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 22px', fontSize: 13, color: 'rgba(255,255,255,0.4)',
                    cursor: 'default', transition: 'all 0.2s'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#c4653a', color: '#fff' }}>Soon</span>
                  </div>
                )
              }

              return (
                <NavLink key={link.to} to={link.to} end={link.to === '/app' || link.to === '/app/doctor-dashboard'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 22px', fontSize: 13, textDecoration: 'none',
                    borderLeft: isActive ? '3px solid #7bcaa4' : '3px solid transparent',
                    color: isActive ? '#7bcaa4' : 'rgba(255,255,255,0.55)',
                    background: isActive ? 'rgba(123,202,164,0.12)' : 'transparent',
                    transition: 'all 0.14s',
                  })}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>{link.icon}</span>
                  <span style={{ flex: 1 }}>{link.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', position: 'relative' }} ref={menuRef}>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute', bottom: 70, left: 10, width: 180,
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '0.5px solid #e8d5bc', zIndex: 999
              }}
            >
              <div 
                onClick={() => { 
                  setShowMenu(false);
                  localStorage.removeItem('gramdoc_token');
                  localStorage.removeItem('gramdoc_user');
                  localStorage.removeItem('gramdoc_lang');
                  localStorage.removeItem('gd_token');
                  localStorage.removeItem('gd_user');
                  localStorage.removeItem('gd_patient_language');
                  localStorage.removeItem('gd_active_patient');
                  localStorage.removeItem('gd_triage');
                  navigate('/');
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAECE7'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ padding: '12px 16px', fontSize: 13, cursor: 'pointer', color: '#c4653a', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
              >
                <span>🚪</span> Sign Out
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {(() => {
          const userName = user?.name || 'User'
          const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f3d2a', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 10, color: '#6b5e50', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isDoc ? (
                    <>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.isAvailable !== false ? '#1d9e75' : '#6b5e50' }} />
                      {user.specialization || 'General Physician'}
                    </>
                  ) : isPharmacy ? (
                    <span style={{ cursor: 'default' }}>
                      💊 Pharmacy
                    </span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isAsha ? (
                        <span style={{ cursor: 'default' }}>
                          🌐 🇮🇳 English
                        </span>
                      ) : (
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/language')}>
                          🌐 {LANGS[langKey]?.flag || '🇮🇳'} {LANGS[langKey]?.native || 'English'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span onClick={() => setShowMenu(!showMenu)}
                style={{ fontSize: 16, cursor: 'pointer', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>⚙️</span>
            </div>
          )
        })()}
      </div>
    </aside>
  )
}
