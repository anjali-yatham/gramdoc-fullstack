import { motion } from 'framer-motion'

const COLORS = {
  forest: '#0f3d2a',
  mint: '#7bcaa4',
  cream: '#fdf6ec',
  sandstone: '#e8d5bc',
  warmGray: '#6b5e50',
}

const FONTS = {
  display: 'Fraunces, serif',
  body: 'Mukta, sans-serif',
}

const PAYOUT_HISTORY = [
  { date: 'Apr 28', orders: 52, gross: 12400, commission: 992, net: 11408, status: 'Paid' },
  { date: 'Apr 21', orders: 48, gross: 11200, commission: 896, net: 10304, status: 'Paid' },
  { date: 'Apr 14', orders: 61, gross: 14100, commission: 1128, net: 12972, status: 'Paid' },
]

const WEEKLY_DATA = [
  { day: 'Mon', value: 800 },
  { day: 'Tue', value: 1200 },
  { day: 'Wed', value: 1800 },
  { day: 'Thu', value: 2400 },
  { day: 'Fri', value: 1600 },
  { day: 'Sat', value: 2200 },
  { day: 'Sun', value: 2400 },
]

export default function PharmacyEarnings() {
  const maxValue = Math.max(...WEEKLY_DATA.map(d => d.value))

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body, padding: '32px' }}>
      <h1 style={{ 
        fontFamily: FONTS.display, 
        fontStyle: 'italic', 
        fontSize: 32, 
        color: COLORS.forest,
        marginBottom: 8
      }}>
        💰 Earnings
      </h1>
      <p style={{ fontSize: 13, color: COLORS.warmGray, marginBottom: 24 }}>
        Track your revenue and payouts
      </p>

      {/* EARNINGS HEADER CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #2d5fa3, #1a3d6b)',
          borderRadius: 20,
          padding: '32px',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(45,95,163,0.3)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              TODAY
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              ₹2,400
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              12 orders
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              THIS WEEK
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              ₹14,800
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              67 orders
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              THIS MONTH
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              ₹52,000
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              234 orders
            </div>
          </div>
        </div>
      </motion.div>

      {/* COMMISSION BREAKDOWN */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h2 style={{ 
          fontFamily: FONTS.display, 
          fontStyle: 'italic', 
          fontSize: 20, 
          color: COLORS.forest,
          marginBottom: 16
        }}>
          GramDoc Partnership Earnings
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${COLORS.cream}` }}>
              <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.warmGray }}>
                Total Order Value
              </td>
              <td style={{ padding: '12px 0', fontSize: 16, fontWeight: 700, color: COLORS.forest, textAlign: 'right' }}>
                ₹56,520
              </td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${COLORS.cream}` }}>
              <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.warmGray }}>
                GramDoc Commission (8%)
              </td>
              <td style={{ padding: '12px 0', fontSize: 16, fontWeight: 700, color: COLORS.critical, textAlign: 'right' }}>
                -₹4,522
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', fontSize: 16, fontWeight: 700, color: COLORS.forest }}>
                Your Net Earnings
              </td>
              <td style={{ padding: '12px 0', fontSize: 24, fontWeight: 800, color: COLORS.mint, textAlign: 'right' }}>
                ₹51,998
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: '#e8f5ee', 
          borderRadius: 10,
          fontSize: 13,
          color: COLORS.mint,
          fontWeight: 600
        }}>
          💳 Next settlement: Monday
        </div>
      </motion.div>

      {/* REVENUE CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h2 style={{ 
          fontFamily: FONTS.display, 
          fontStyle: 'italic', 
          fontSize: 20, 
          color: COLORS.forest,
          marginBottom: 20
        }}>
          7-Day Revenue Chart
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
          {WEEKLY_DATA.map((item, i) => {
            const height = (item.value / maxValue) * 100
            return (
              <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.mint }}>
                  ₹{item.value}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  style={{
                    width: '100%',
                    background: `linear-gradient(to top, ${COLORS.mint}, ${COLORS.forest})`,
                    borderRadius: '8px 8px 0 0',
                    minHeight: 20
                  }}
                />
                <div style={{ fontSize: 12, color: COLORS.warmGray, fontWeight: 600 }}>
                  {item.day}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* PAYOUT HISTORY */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.sandstone}`,
          boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
        }}
      >
        <h2 style={{ 
          fontFamily: FONTS.display, 
          fontStyle: 'italic', 
          fontSize: 20, 
          color: COLORS.forest,
          marginBottom: 16
        }}>
          Payout History
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.sandstone}` }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                DATE
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                ORDERS
              </th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                GROSS
              </th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                COMMISSION
              </th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                NET
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {PAYOUT_HISTORY.map((payout, i) => (
              <motion.tr
                key={payout.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                style={{ borderBottom: `1px solid ${COLORS.cream}` }}
              >
                <td style={{ padding: '16px 8px', fontSize: 14, color: COLORS.forest }}>
                  {payout.date}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'center', color: COLORS.warmGray }}>
                  {payout.orders}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'right', color: COLORS.forest }}>
                  ₹{payout.gross.toLocaleString()}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'right', color: COLORS.critical }}>
                  ₹{payout.commission.toLocaleString()}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'right', fontWeight: 700, color: COLORS.mint }}>
                  ₹{payout.net.toLocaleString()}
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#e8f5ee',
                    color: COLORS.mint
                  }}>
                    ✅ {payout.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
