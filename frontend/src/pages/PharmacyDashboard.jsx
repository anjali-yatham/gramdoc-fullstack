import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { safeParse } from '../utils/api'
import toast from 'react-hot-toast'

const COLORS = {
  forest: '#0f3d2a',
  mint: '#7bcaa4',
  cream: '#fdf6ec',
  sandstone: '#e8d5bc',
  warmGray: '#6b5e50',
  critical: '#A32D2D',
  amber: '#854F0B',
}

const FONTS = {
  display: 'Fraunces, serif',
  body: 'Mukta, sans-serif',
}

export default function PharmacyDashboard() {
  const user = safeParse(localStorage.getItem('gramdoc_user'), {})
  const pharmacyName = user.name || 'Pharmacy'
  
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('gd_pharmacy_orders')
    if (saved) return JSON.parse(saved)
    return [
      {
        id: 'ORD001',
        status: 'new',
        patient: 'Lakshmi Devi',
        village: 'Kondapur (2.3 km away)',
        time: '2 mins ago',
        verified: true,
        medicines: [
          'Paracetamol 500mg × 10',
          'ORS Sachet × 5',
          'Cetirizine 10mg × 6'
        ],
        amount: 185,
        fee: 14.80,
        earnings: 170.20
      },
      {
        id: 'ORD002',
        status: 'packing',
        patient: 'Ravi Kumar',
        village: 'Gachibowli (1.8 km away)',
        time: '15 mins ago',
        verified: true,
        medicines: [
          'Amoxicillin 500mg × 15',
          'Paracetamol 500mg × 10'
        ],
        amount: 220,
        fee: 17.60,
        earnings: 202.40
      },
      {
        id: 'ORD003',
        status: 'dispatched',
        patient: 'Sunita Reddy',
        village: 'Madhapur (3.1 km away)',
        time: '45 mins ago',
        verified: true,
        medicines: [
          'Metformin 500mg × 30',
          'Aspirin 75mg × 30'
        ],
        amount: 195,
        fee: 15.60,
        earnings: 179.40
      }
    ]
  })

  useEffect(() => {
    localStorage.setItem('gd_pharmacy_orders', JSON.stringify(orders))
  }, [orders])

  const handleAccept = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'packing' } : o))
    toast.success('Order accepted!')
  }

  const handleReject = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o))
    toast('Order rejected')
  }

  const handleDispatch = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'dispatched' } : o))
    toast.success('Marked as dispatched!')
  }

  const handleDeliver = (orderId) => {
    const order = orders.find(o => o.id === orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
    toast.success(`Order delivered! ₹${order?.earnings || 0} credited`)
  }

  const todayOrders = orders.filter(o => o.status !== 'rejected').length
  const pendingOrders = orders.filter(o => o.status === 'new').length
  const todayRevenue = orders.filter(o => o.status !== 'rejected').reduce((sum, o) => sum + o.amount, 0)
  const dispensedCount = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.medicines.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body, padding: '32px' }}>
      {/* HERO CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #2d5fa3, #1a3d6b)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(45,95,163,0.3)'
        }}
      >
        <div>
          <h1 style={{ 
            fontFamily: FONTS.display, 
            fontStyle: 'italic', 
            fontSize: 32, 
            color: '#fff', 
            margin: 0 
          }}>
            💊 {pharmacyName}
          </h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
            Licensed Pharmacy Partner
          </div>
          <div style={{ 
            display: 'inline-block',
            background: COLORS.mint,
            color: COLORS.forest,
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            marginTop: 12
          }}>
            ✓ GramDoc Verified
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
            {user.village || 'Hyderabad'}, {user.state || 'Telangana'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '3px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 800,
              color: '#fff',
              position: 'relative'
            }}
          >
            {todayOrders}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.5)'
              }}
            />
          </motion.div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 12 }}>
            Orders Today
          </div>
        </div>
      </motion.div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📦', label: 'Orders Today', value: todayOrders, sub: `${pendingOrders} pending` },
          { icon: '⏳', label: 'Pending', value: pendingOrders, sub: 'needs attention' },
          { icon: '💰', label: 'Revenue Today', value: `₹${todayRevenue}`, sub: '+12%' },
          { icon: '💊', label: 'Dispensed', value: dispensedCount, sub: 'medicines today' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              border: `1px solid ${COLORS.sandstone}`,
              boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 11, color: COLORS.warmGray, marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.forest, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: COLORS.warmGray }}>{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* LIVE ORDERS SECTION */}
      <div>
        <h2 style={{ 
          fontFamily: FONTS.display, 
          fontStyle: 'italic', 
          fontSize: 22, 
          color: COLORS.forest,
          marginBottom: 8
        }}>
          📦 Live Orders
        </h2>
        <p style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 16 }}>
          New prescription orders
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.filter(o => o.status !== 'rejected' && o.status !== 'delivered').map((order, i) => {
            const borderColor = order.status === 'new' ? COLORS.critical : 
                               order.status === 'packing' ? '#d97706' : 
                               '#3b82f6'
            const badgeColor = order.status === 'new' ? COLORS.critical :
                              order.status === 'packing' ? '#d97706' :
                              '#3b82f6'
            const badgeText = order.status === 'new' ? '🔴 NEW ORDER' :
                             order.status === 'packing' ? '🟡 PACKING' :
                             '🔵 OUT FOR DELIVERY'

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  borderLeft: `4px solid ${borderColor}`,
                  boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
                }}
              >
                <div style={{ 
                  display: 'inline-block',
                  background: badgeColor,
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 12
                }}>
                  {badgeText}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
                      {order.patient}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 2 }}>
                      📍 {order.village}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.warmGray, marginBottom: 8 }}>
                      🕐 {order.time}
                    </div>
                    {order.verified && (
                      <div style={{
                        display: 'inline-block',
                        background: '#e8f5ee',
                        color: COLORS.mint,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        📋 Prescription QR Verified ✅
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
                      Medicines:
                    </div>
                    {order.medicines.map((med, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: COLORS.warmGray, marginBottom: 4 }}>
                        • {med}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: `1px solid ${COLORS.sandstone}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: COLORS.warmGray }}>
                      Amount: <span style={{ fontWeight: 700, color: COLORS.forest }}>₹{order.amount}</span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.warmGray }}>
                      GramDoc fee (8%): ₹{order.fee.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.mint, marginTop: 4 }}>
                      Your earnings: ₹{order.earnings.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {order.status === 'new' && (
                      <>
                        <button
                          onClick={() => handleAccept(order.id)}
                          style={{
                            background: COLORS.mint,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 20px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: FONTS.body
                          }}
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleReject(order.id)}
                          style={{
                            background: 'transparent',
                            color: COLORS.critical,
                            border: `2px solid ${COLORS.critical}`,
                            borderRadius: 10,
                            padding: '10px 20px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: FONTS.body
                          }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {order.status === 'packing' && (
                      <button
                        onClick={() => handleDispatch(order.id)}
                        style={{
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: FONTS.body
                        }}
                      >
                        📦 Mark as Dispatched
                      </button>
                    )}
                    {order.status === 'dispatched' && (
                      <button
                        onClick={() => handleDeliver(order.id)}
                        style={{
                          background: COLORS.mint,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: FONTS.body
                        }}
                      >
                        ✅ Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
