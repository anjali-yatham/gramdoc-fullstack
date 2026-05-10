import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const COLORS = {
  forest: '#0f3d2a',
  mint: '#7bcaa4',
  cream: '#fdf6ec',
  sandstone: '#e8d5bc',
  warmGray: '#6b5e50',
  critical: '#A32D2D',
}

const FONTS = {
  display: 'Fraunces, serif',
  body: 'Mukta, sans-serif',
}

export default function PharmacyOrders() {
  const [activeTab, setActiveTab] = useState('All')
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('gd_pharmacy_orders')
    if (saved) return JSON.parse(saved)
    return []
  })

  useEffect(() => {
    localStorage.setItem('gd_pharmacy_orders', JSON.stringify(orders))
  }, [orders])

  const tabs = ['All', 'New', 'Accepted', 'Packing', 'Dispatched', 'Delivered', 'Cancelled']

  const getStatusCount = (status) => {
    if (status === 'All') return orders.length
    if (status === 'Accepted') return orders.filter(o => o.status === 'packing').length
    if (status === 'Cancelled') return orders.filter(o => o.status === 'rejected').length
    return orders.filter(o => o.status === status.toLowerCase()).length
  }

  const filteredOrders = activeTab === 'All' 
    ? orders 
    : activeTab === 'Accepted'
    ? orders.filter(o => o.status === 'packing')
    : activeTab === 'Cancelled'
    ? orders.filter(o => o.status === 'rejected')
    : orders.filter(o => o.status === activeTab.toLowerCase())

  const getTimeline = (order) => {
    const steps = [
      { label: 'Order Placed', time: '10:30 AM', completed: true },
      { label: 'Accepted', time: '10:35 AM', completed: order.status !== 'new' && order.status !== 'rejected' },
      { label: 'Packing', time: '10:40 AM', completed: order.status === 'packing' || order.status === 'dispatched' || order.status === 'delivered' },
      { label: 'Dispatched', time: 'pending', completed: order.status === 'dispatched' || order.status === 'delivered' },
      { label: 'Delivered', time: 'pending', completed: order.status === 'delivered' }
    ]
    return steps
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body, padding: '32px' }}>
      <h1 style={{ 
        fontFamily: FONTS.display, 
        fontStyle: 'italic', 
        fontSize: 32, 
        color: COLORS.forest,
        marginBottom: 8
      }}>
        📦 Orders
      </h1>
      <p style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 24 }}>
        Manage all prescription orders
      </p>

      {/* FILTER TABS */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 8
      }}>
        {tabs.map(tab => {
          const count = getStatusCount(tab)
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? COLORS.forest : '#fff',
                color: activeTab === tab ? '#fff' : COLORS.forest,
                border: `2px solid ${activeTab === tab ? COLORS.forest : COLORS.sandstone}`,
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONTS.body,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* ORDERS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            border: `1px solid ${COLORS.sandstone}`
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 16, color: COLORS.warmGray }}>
              No orders in this category
            </div>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const timeline = getTimeline(order)
            const borderColor = order.status === 'new' ? COLORS.critical : 
                               order.status === 'packing' ? '#d97706' : 
                               order.status === 'dispatched' ? '#3b82f6' :
                               order.status === 'delivered' ? COLORS.mint :
                               COLORS.warmGray

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 24,
                  borderLeft: `4px solid ${borderColor}`,
                  boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.warmGray, marginBottom: 4 }}>
                      Order ID: {order.id}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest }}>
                      {order.patient}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.warmGray, marginTop: 4 }}>
                      📍 {order.village} • 🕐 {order.time}
                    </div>
                  </div>
                  <div style={{
                    background: borderColor,
                    color: '#fff',
                    padding: '6px 16px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    height: 'fit-content',
                    textTransform: 'uppercase'
                  }}>
                    {order.status === 'rejected' ? 'Cancelled' : order.status}
                  </div>
                </div>

                {/* TIMELINE */}
                <div style={{ 
                  background: COLORS.cream, 
                  borderRadius: 12, 
                  padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.forest, marginBottom: 12 }}>
                    Order Status Timeline
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {timeline.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: step.completed ? COLORS.mint : COLORS.sandstone,
                          border: `2px solid ${step.completed ? COLORS.mint : COLORS.sandstone}`
                        }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ 
                            fontSize: 12, 
                            color: step.completed ? COLORS.forest : COLORS.warmGray,
                            fontWeight: step.completed ? 600 : 400
                          }}>
                            {step.label}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: 11, 
                          color: COLORS.warmGray 
                        }}>
                          {step.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MEDICINES */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
                    Medicines:
                  </div>
                  {order.medicines.map((med, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: COLORS.warmGray, marginBottom: 4 }}>
                      • {med}
                    </div>
                  ))}
                </div>

                {/* AMOUNT */}
                <div style={{ 
                  paddingTop: 16, 
                  borderTop: `1px solid ${COLORS.sandstone}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: COLORS.warmGray }}>
                      Total: <span style={{ fontWeight: 700, color: COLORS.forest }}>₹{order.amount}</span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.warmGray }}>
                      Commission: ₹{order.fee.toFixed(2)} • Your earnings: ₹{order.earnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
