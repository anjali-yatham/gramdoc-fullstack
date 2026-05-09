import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { api } from '../utils/api'
import toast from 'react-hot-toast'

export default function Layout() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showStatus, setShowStatus] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const hideTopbar = pathname === '/app/doctor-dashboard'

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
      syncOfflineData()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function syncOfflineData() {
    const user = JSON.parse(localStorage.getItem('gramdoc_user') || '{}')
    if (!user.id && !localStorage.getItem('gramdoc_token')) return

    // 1. Sync generic gd_offline_sync queue (from api.js dualSave)
    const syncQueue = JSON.parse(localStorage.getItem('gd_offline_sync') || '[]')
    if (syncQueue.length > 0) {
      toast.loading('Syncing background data...', { id: 'bg-sync' })
      let success = 0
      for (const item of syncQueue) {
        try {
          // Process generic dualSave queue items
          // Note: dualSave sends data to /api/sync, but we can also manually retry here
          await api.saveSchedule(item.data) // Example: current dualSave mostly used for schedule
          success++
        } catch(e) {}
      }
      localStorage.setItem('gd_offline_sync', '[]')
      if (success > 0) toast.success(`Synced ${success} items`, { id: 'bg-sync' })
      else toast.dismiss('bg-sync')
    }

    // 2. Sync gd_offline_symptoms (triage)
    const offlineSymptoms = JSON.parse(localStorage.getItem('gd_offline_symptoms') || '[]')
    const unsynced = offlineSymptoms.filter(s => !s.synced)
    
    if (unsynced.length > 0) {
      toast.loading('Syncing offline symptoms...', { id: 'sync-symptoms' })
      let successCount = 0
      for (const item of unsynced) {
        try {
          await api.triageChat([{ role: 'user', text: item.symptoms }])
          item.synced = true
          successCount++
        } catch (err) { }
      }
      if (successCount > 0) {
        const updated = offlineSymptoms.map(s => unsynced.find(u => u.timestamp === s.timestamp) ? { ...s, synced: true } : s)
        localStorage.setItem('gd_offline_symptoms', JSON.stringify(updated))
        toast.success(`Synced ${successCount} symptoms`, { id: 'sync-symptoms' })
      } else {
        toast.dismiss('sync-symptoms')
      }
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted PWA install')
    }
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {!hideTopbar && <Topbar />}
        
        {/* Offline Warning Bar */}
        {!isOnline && (
          <div style={{ 
            background: '#FEF3C7', borderBottom: '1px solid #F59E0B', 
            padding: '10px 20px', color: '#92400E', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 10, zIndex: 1000
          }}>
            <span>📶</span>
            You are offline. Your symptoms will be saved and sent when internet returns.
          </div>
        )}

        {/* PWA Install Banner - Only on Patient Dashboard */}
        {showInstallBanner && pathname === '/app' && !localStorage.getItem('gd_pwa_dismissed') && (
          <div style={{ 
            background: '#0f3d2a', color: '#fff', padding: '12px 24px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '13px', zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              Install GramDoc on your phone for offline access
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleInstallClick} style={{ background: '#7bcaa4', color: '#0f3d2a', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}>Install</button>
              <button onClick={() => { setShowInstallBanner(false); localStorage.setItem('gd_pwa_dismissed', 'true') }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}>Dismiss</button>
            </div>
          </div>
        )}
        
        {/* Connection Status Pill (Small) */}
        {showStatus && isOnline && (
          <div style={{ 
            position: 'absolute', top: 20, right: 20, zIndex: 1000,
            background: '#1d9e75', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
            Back Online
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--sand)' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
