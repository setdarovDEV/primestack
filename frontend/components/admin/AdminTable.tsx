'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

export interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'number'
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}

interface Props {
  title: string
  data: any[]
  columns: Column[]
  fields: Field[]
  onSave: (data: any, isEdit: boolean) => Promise<void>
  onDelete: (id: string | number) => Promise<void>
  searchKey?: string
}

export default function AdminTable({ title, data, columns, fields, onSave, onDelete, searchKey }: Props) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<any>(null)

  const filtered = searchKey
    ? data.filter((row) => String(row[searchKey] || '').toLowerCase().includes(search.toLowerCase()))
    : data

  const openCreate = () => {
    const defaults: any = {}
    fields.forEach((f) => {
      defaults[f.key] = f.type === 'toggle' ? true : ''
    })
    setFormData(defaults)
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setFormData({ ...row })
    setEditItem(row)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const missing = fields.find((field) => field.required && !String(formData[field.key] ?? '').trim())
    if (missing) {
      toast.error(`${missing.label} majburiy maydon`)
      return
    }
    setLoading(true)
    try {
      await onSave(formData, !!editItem)
      toast.success(editItem ? 'Muvaffaqiyatli yangilandi' : 'Muvaffaqiyatli qo\'shildi')
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: any) => {
    setLoading(true)
    try {
      await onDelete(id)
      toast.success("O'chirildi")
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} ta yozuv</p>
        </div>
        <div className="flex items-center gap-3">
          {searchKey && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="form-input pl-12 py-2 text-sm w-48"
              />
            </div>
          )}
          <button onClick={openCreate} className="btn-primary text-sm py-2 gap-1.5">
            <Plus size={15} /> Qo'shish
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(26,45,74,0.8)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,30,53,0.9)', borderBottom: '1px solid rgba(26,45,74,0.8)' }}>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-mono text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,45,74,0.5)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-500 text-sm"
                    style={{ background: 'rgba(15,30,53,0.6)' }}>
                    Hech narsa topilmadi
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <motion.tr
                  key={row.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-white/[0.02] transition-colors"
                  style={{ background: 'rgba(15,30,53,0.6)' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary-400 hover:bg-primary-400/10 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(row.id || i)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
              style={{ background: '#0F1E35', border: '1px solid rgba(26,45,74,0.9)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-navy-border">
                <h3 className="font-display font-semibold text-white">
                  {editItem ? 'Tahrirlash' : 'Yangi qo\'shish'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={4}
                        className="form-input resize-none text-sm"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="form-input text-sm"
                      >
                        <option value="">Tanlang...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'toggle' ? (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [field.key]: !formData[field.key] })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${formData[field.key] ? 'bg-primary-500' : 'bg-navy-light'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData[field.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="form-input text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-navy-border">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center text-sm py-2">
                  Bekor
                </button>
                <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center text-sm py-2">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl p-6 z-10"
              style={{ background: '#0F1E35', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <h3 className="font-display font-semibold text-white mb-2">O'chirishni tasdiqlang</h3>
              <p className="text-sm text-gray-400 mb-5">Bu amalni qaytarib bo'lmaydi.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center text-sm py-2">Bekor</button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-red-400 transition-all"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
