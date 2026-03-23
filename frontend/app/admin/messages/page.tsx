'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trash2, Download, X, Mail, Phone, Building2, Globe, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApiFetch } from '@/lib/api'

type MessageStatus = 'new' | 'read' | 'replied' | 'spam' | string

type MessageItem = {
  id: number
  name: string
  company: string
  email: string
  phone: string
  message: string
  source_page: string
  status: MessageStatus
  created_at: string
}

function toSafe(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function normalizeMessage(item: any): MessageItem {
  return {
    id: Number(item?.id || 0),
    name: toSafe(item?.name),
    company: toSafe(item?.company),
    email: toSafe(item?.email),
    phone: toSafe(item?.phone),
    message: toSafe(item?.message),
    source_page: toSafe(item?.source_page),
    status: toSafe(item?.status) || 'new',
    created_at: toSafe(item?.created_at),
  }
}

function formatDate(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusMap: Record<string, { label: string; cls: string }> = {
  new: { label: 'Yangi', cls: 'badge-info' },
  read: { label: "Ko'rildi", cls: 'badge-warning' },
  replied: { label: 'Javob berildi', cls: 'badge-success' },
  spam: { label: 'Spam', cls: 'badge-danger' },
}

export default function AdminMessagesPage() {
  const [data, setData] = useState<MessageItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await adminApiFetch('/api/v1/admin/messages?per_page=200')
      const json = await res.json()
      const raw = Array.isArray(json?.data?.data) ? json.data.data : []
      const rows = raw.map(normalizeMessage)
      setData(rows)
      if (rows.length === 0) {
        setSelectedId(null)
      } else if (selectedId !== null && !rows.some((m: MessageItem) => m.id === selectedId)) {
        setSelectedId(rows[0].id)
      }
    } catch {
      setData([])
      toast.error('Xabarlarni yuklab bo‘lmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q)
    )
  }, [data, search])

  const selected = selectedId ? data.find((m) => m.id === selectedId) || null : null

  const updateStatus = async (id: number, status: MessageStatus, toastMessage?: string) => {
    const before = data
    setUpdatingId(id)
    setData((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    try {
      await adminApiFetch(`/api/v1/admin/messages/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (toastMessage) toast.success(toastMessage)
    } catch {
      setData(before)
      toast.error('Status yangilanmadi')
    } finally {
      setUpdatingId(null)
    }
  }

  const markRead = async (id: number) => {
    const item = data.find((m) => m.id === id)
    if (!item || item.status !== 'new') return
    await updateStatus(id, 'read')
  }

  const markReplied = async (id: number) => {
    await updateStatus(id, 'replied', 'Javob berilgan deb belgilandi')
  }

  const deleteMsg = async (id: number) => {
    try {
      await adminApiFetch(`/api/v1/admin/messages/${id}`, { method: 'DELETE' })
      setData((prev) => prev.filter((m) => m.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast.success("O'chirildi")
    } catch {
      toast.error("O'chirishda xatolik")
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Ism', 'Kompaniya', 'Email', 'Telefon', 'Xabar', 'Holat', 'Sana']
    const rows = filtered.map(m => [m.id, m.name, m.company, m.email, m.phone, `"${m.message.replace(/"/g, '""')}"`, m.status, formatDate(m.created_at)])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'messages.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV yuklab olindi')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Xabarlar</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} ta xabar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="form-input pl-12 py-2 text-sm w-44" />
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm py-2 gap-1.5" disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(26,45,74,0.8)', background: 'rgba(15,30,53,0.6)' }}>
          <div className="divide-y divide-navy-border max-h-[600px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Yuklanmoqda...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Hozircha zakazlar yo&apos;q</div>
            )}
            {filtered.map((m) => (
              <div key={m.id}
                onClick={() => { setSelectedId(m.id); void markRead(m.id) }}
                className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${selected?.id === m.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">{m.name}</span>
                      <span className={(statusMap[m.status]?.cls || 'badge-warning') + ' ml-2 flex-shrink-0'}>
                        {statusMap[m.status]?.label || m.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{m.company || '-'}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{m.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl p-6 h-full" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center font-bold text-white">
                    {selected.name[0]}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{selected.name}</h3>
                    <span className={statusMap[selected.status]?.cls || 'badge-warning'}>
                      {statusMap[selected.status]?.label || selected.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Building2, label: 'Kompaniya', value: selected.company || '-' },
                  { icon: Mail, label: 'Email', value: selected.email },
                  { icon: Phone, label: 'Telefon', value: selected.phone || '-' },
                  { icon: Globe, label: 'Sahifa', value: selected.source_page || '-' },
                  { icon: Clock, label: 'Vaqt', value: formatDate(selected.created_at) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon size={13} className="text-primary-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-sm text-gray-300">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(0,87,255,0.05)', border: '1px solid rgba(0,87,255,0.15)' }}>
                <div className="text-xs text-gray-500 mb-2">Xabar</div>
                <p className="text-sm text-gray-300 leading-relaxed">{selected.message}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => void markReplied(selected.id)}
                  disabled={updatingId === selected.id}
                  className="btn-primary text-sm py-2 flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Javob berildi ✓
                </button>
                <button onClick={() => void deleteMsg(selected.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-red-400 transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 size={14} /> O'chirish
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl flex items-center justify-center h-64" style={{ background: 'rgba(15,30,53,0.4)', border: '1px dashed rgba(26,45,74,0.8)' }}>
              <div className="text-center">
                <Mail size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Xabarni ko'rish uchun tanlang</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
