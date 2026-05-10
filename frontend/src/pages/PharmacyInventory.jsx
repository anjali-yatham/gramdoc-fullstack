import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const INITIAL_MEDICINES = [
  { id: 1, name: 'Paracetamol 500mg', stock: 45, price: 2.5, expiry: 'Dec 2026', status: 'good' },
  { id: 2, name: 'ORS Sachet', stock: 8, price: 15, expiry: 'Mar 2027', status: 'low' },
  { id: 3, name: 'Cetirizine 10mg', stock: 3, price: 8, expiry: 'Jun 2026', status: 'critical' },
  { id: 4, name: 'Amoxicillin 500mg', stock: 67, price: 12, expiry: 'Sep 2026', status: 'good' },
  { id: 5, name: 'Metformin 500mg', stock: 23, price: 4.5, expiry: 'Jan 2027', status: 'good' },
]

export default function PharmacyInventory() {
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('gd_pharmacy_inventory')
    if (saved) return JSON.parse(saved)
    return INITIAL_MEDICINES
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newStock, setNewStock] = useState('')
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    stock: '',
    price: '',
    expiry: '',
    category: 'General'
  })

  useEffect(() => {
    localStorage.setItem('gd_pharmacy_inventory', JSON.stringify(medicines))
  }, [medicines])

  const updateStock = (id) => {
    const quantity = parseInt(newStock)
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Invalid quantity')
      return
    }
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        const updatedStock = m.stock + quantity
        return {
          ...m,
          stock: updatedStock,
          status: updatedStock > 20 ? 'good' : updatedStock >= 10 ? 'low' : 'critical'
        }
      }
      return m
    }))
    setEditingId(null)
    setNewStock('')
    toast.success('Stock updated!')
  }

  const addMedicine = () => {
    if (!newMedicine.name || !newMedicine.stock || !newMedicine.price || !newMedicine.expiry) {
      toast.error('Please fill all fields')
      return
    }
    const stock = parseInt(newMedicine.stock)
    const medicine = {
      id: Date.now(),
      name: newMedicine.name,
      stock,
      price: parseFloat(newMedicine.price),
      expiry: newMedicine.expiry,
      status: stock > 20 ? 'good' : stock >= 10 ? 'low' : 'critical',
      category: newMedicine.category
    }
    setMedicines(prev => [...prev, medicine])
    setNewMedicine({ name: '', stock: '', price: '', expiry: '', category: 'General' })
    setShowAddModal(false)
    toast.success('Medicine added!')
  }

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockMedicines = medicines.filter(m => m.stock < 10)

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: FONTS.body, padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ 
            fontFamily: FONTS.display, 
            fontStyle: 'italic', 
            fontSize: 32, 
            color: COLORS.forest,
            marginBottom: 8
          }}>
            💊 Inventory
          </h1>
          <p style={{ fontSize: 13, color: COLORS.warmGray }}>
            Manage medicine stock and pricing
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: COLORS.mint,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONTS.body
          }}
        >
          + Add New Medicine
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="🔍 Search medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 20px',
            fontSize: 14,
            border: `2px solid ${COLORS.sandstone}`,
            borderRadius: 12,
            fontFamily: FONTS.body,
            outline: 'none'
          }}
        />
      </div>

      {/* LOW STOCK ALERTS */}
      {lowStockMedicines.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: `2px solid ${COLORS.critical}`,
          boxShadow: '0 4px 16px rgba(163,45,45,0.1)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.critical, marginBottom: 12 }}>
            ⚠️ Low Stock Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowStockMedicines.map(m => (
              <div key={m.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: COLORS.cream,
                borderRadius: 8
              }}>
                <span style={{ fontSize: 13, color: COLORS.forest }}>{m.name}</span>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 700,
                  color: m.stock < 5 ? COLORS.critical : '#d97706'
                }}>
                  Only {m.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDICINES TABLE */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${COLORS.sandstone}`,
        boxShadow: '0 4px 16px rgba(15,61,42,0.06)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.sandstone}` }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                MEDICINE
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                STOCK
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                PRICE
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                EXPIRY
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                STATUS
              </th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 12, fontWeight: 700, color: COLORS.warmGray }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((medicine, i) => (
              <motion.tr
                key={medicine.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{ borderBottom: `1px solid ${COLORS.cream}` }}
              >
                <td style={{ padding: '16px 8px', fontSize: 14, color: COLORS.forest }}>
                  {medicine.name}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'center', fontWeight: 700 }}>
                  {editingId === medicine.id ? (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <span>{medicine.stock} +</span>
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        placeholder="Add"
                        style={{
                          width: 60,
                          padding: '4px 8px',
                          border: `2px solid ${COLORS.mint}`,
                          borderRadius: 6,
                          fontSize: 13,
                          textAlign: 'center'
                        }}
                      />
                      <button
                        onClick={() => updateStock(medicine.id)}
                        style={{
                          background: COLORS.mint,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 12px',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setNewStock('')
                        }}
                        style={{
                          background: 'transparent',
                          color: COLORS.warmGray,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    medicine.stock
                  )}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 14, textAlign: 'center' }}>
                  ₹{medicine.price}
                </td>
                <td style={{ padding: '16px 8px', fontSize: 13, textAlign: 'center', color: COLORS.warmGray }}>
                  {medicine.expiry}
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: medicine.status === 'good' ? '#e8f5ee' :
                               medicine.status === 'low' ? '#fef3c7' :
                               '#fee2e2',
                    color: medicine.status === 'good' ? COLORS.mint :
                          medicine.status === 'low' ? '#d97706' :
                          COLORS.critical
                  }}>
                    {medicine.status === 'good' ? '🟢 Good' :
                     medicine.status === 'low' ? '🟡 Low' :
                     '🔴 Critical'}
                  </span>
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                  {editingId !== medicine.id && (
                    <button
                      onClick={() => setEditingId(medicine.id)}
                      style={{
                        background: COLORS.forest,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: FONTS.body
                      }}
                    >
                      + Update Stock
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD MEDICINE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 32,
                width: '90%',
                maxWidth: 500,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <h2 style={{ 
                fontFamily: FONTS.display, 
                fontStyle: 'italic', 
                fontSize: 24, 
                color: COLORS.forest,
                marginBottom: 20
              }}>
                Add New Medicine
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${COLORS.sandstone}`,
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: FONTS.body
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: `2px solid ${COLORS.sandstone}`,
                        borderRadius: 10,
                        fontSize: 14,
                        fontFamily: FONTS.body
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                      Price per Unit (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: `2px solid ${COLORS.sandstone}`,
                        borderRadius: 10,
                        fontSize: 14,
                        fontFamily: FONTS.body
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dec 2026"
                    value={newMedicine.expiry}
                    onChange={(e) => setNewMedicine({ ...newMedicine, expiry: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${COLORS.sandstone}`,
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: FONTS.body
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warmGray, display: 'block', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={newMedicine.category}
                    onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `2px solid ${COLORS.sandstone}`,
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: FONTS.body
                    }}
                  >
                    <option>General</option>
                    <option>Antibiotics</option>
                    <option>Pain Relief</option>
                    <option>Diabetes</option>
                    <option>Cardiac</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  onClick={addMedicine}
                  style={{
                    flex: 1,
                    background: COLORS.mint,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: FONTS.body
                  }}
                >
                  Add Medicine
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: COLORS.warmGray,
                    border: `2px solid ${COLORS.sandstone}`,
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: FONTS.body
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
