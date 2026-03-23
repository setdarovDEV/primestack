'use client'
import { useEffect, useMemo, useState } from 'react'
import { Bot, Eye, Search, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApiFetch } from '@/lib/api'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost' | 'archived'

type BotLead = {
  id: number
  telegram_user_id: number
  telegram_chat_id: number
  telegram_username: string
  full_name: string
  company: string
  phone: string
  email: string
  project_type: string
  budget: string
  deadline: string
  description: string
  status: LeadStatus
  created_at: string
}

const statusOptions: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost', 'archived']

const statusLabel: Record<LeadStatus, string> = {
  new: 'Yangi',
  contacted: "Bog'langan",
  qualified: 'Saralangan',
  won: 'Yutildi',
  lost: "Yo'qotildi",
  archived: 'Arxiv',
}

const statusClass: Record<LeadStatus, string> = {
  new: 'badge-info',
  contacted: 'badge-warning',
  qualified: 'badge-success',
  won: 'badge-success',
  lost: 'badge-danger',
  archived: 'badge-warning',
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function safeNumber(v: unknown): number {
  return Number(v) || 0
}

function normalize(item: any): BotLead {
  return {
    id: safeNumber(item?.id),
    telegram_user_id: safeNumber(item?.telegram_user_id),
    telegram_chat_id: safeNumber(item?.telegram_chat_id),
    telegram_username: safeString(item?.telegram_username),
    full_name: safeString(item?.full_name),
    company: safeString(item?.company),
    phone: safeString(item?.phone),
    email: safeString(item?.email),
    project_type: safeString(item?.project_type),
    budget: safeString(item?.budget),
    deadline: safeString(item?.deadline),
    description: safeString(item?.description),
    status: (safeString(item?.status) as LeadStatus) || 'new',
    created_at: safeString(item?.created_at),
  }
}

function formatDate(value: string): string {
  if (!value) return '-'
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

export default function AdminBotLeadsPage() {
  const [leads, setLeads] = useState<BotLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | LeadStatus>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedLead, setSelectedLead] = useState<BotLead | null>(null)

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await adminApiFetch('/api/v1/admin/bot-leads?per_page=200')
      const json = await res.json()
      const rows = Array.isArray(json?.data?.data) ? json.data.data : []
      setLeads(rows.map(normalize))
    } catch {
      setLeads([])
      toast.error('Bot leadlarni yuklab bo‘lmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((lead) => {
      const statusOk = filterStatus === 'all' || lead.status === filterStatus
      if (!statusOk) return false
      if (!q) return true
      return (
        lead.full_name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.project_type.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        String(lead.telegram_user_id).includes(q)
      )
    })
  }, [leads, search, filterStatus])

  const updateStatus = async (id: number, status: LeadStatus) => {
    const before = leads
    setUpdatingId(id)
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
    try {
      await adminApiFetch(`/api/v1/admin/bot-leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success('Status yangilandi')
    } catch {
      setLeads(before)
      toast.error('Status yangilanmadi')
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteLead = async (id: number) => {
    setDeletingId(id)
    try {
      await adminApiFetch(`/api/v1/admin/bot-leads/${id}`, { method: 'DELETE' })
      setLeads((prev) => prev.filter((lead) => lead.id !== id))
      toast.success("Lead o'chirildi")
    } catch {
      toast.error("Leadni o'chirib bo'lmadi")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Bot Leadlar</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} ta lead</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="form-input pl-12 py-2 text-sm w-52"
            />
          </div>
          <select
            className="form-input text-sm py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | LeadStatus)}
          >
            <option value="all">Barcha holatlar</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(26,45,74,0.8)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,30,53,0.9)', borderBottom: '1px solid rgba(26,45,74,0.8)' }}>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Aloqa</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Loyiha</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Holat</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Sana</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,45,74,0.5)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500" style={{ background: 'rgba(15,30,53,0.6)' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500" style={{ background: 'rgba(15,30,53,0.6)' }}>
                    Hozircha bot leadlar yo&apos;q
                  </td>
                </tr>
              )}
              {!loading && filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ background: 'rgba(15,30,53,0.6)' }}
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div className="font-medium text-white">#{lead.id} {lead.full_name || '-'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <Bot size={12} />
                      ID: {lead.telegram_user_id}
                      {lead.telegram_username ? ` (@${lead.telegram_username})` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div>{lead.phone || '-'}</div>
                    <div className="text-xs text-gray-500">{lead.email || '-'}</div>
                    <div className="text-xs text-gray-500">{lead.company || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 max-w-[320px]">
                    <div className="text-white">{lead.project_type || '-'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Byudjet: {lead.budget || '-'}</div>
                    <div className="text-xs text-gray-500">Muddat: {lead.deadline || '-'}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{lead.description || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <span className={statusClass[lead.status]}>{statusLabel[lead.status]}</span>
                    <select
                      className="form-input text-xs py-1 mt-2"
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => void updateStatus(lead.id, e.target.value as LeadStatus)}
                      disabled={updatingId === lead.id}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{statusLabel[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLead(lead)
                        }}
                        className="p-2 rounded-lg text-gray-500 hover:text-primary-400 hover:bg-primary-400/10 transition-colors"
                        title="Batafsil"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void deleteLead(lead.id)
                        }}
                        disabled={deletingId === lead.id}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        title="Leadni o'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedLead(null)} />
          <div
            className="relative w-full max-w-2xl rounded-2xl p-6"
            style={{ background: '#0F1E35', border: '1px solid rgba(26,45,74,0.9)' }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display font-semibold text-white text-xl">Lead #{selectedLead.id}</h3>
                <p className="text-sm text-gray-400 mt-1">{formatDate(selectedLead.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-lg text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,45,74,0.7)' }}>
                <div className="text-xs text-gray-500">Mijoz</div>
                <div className="text-sm text-white mt-1">{selectedLead.full_name || '-'}</div>
                <div className="text-xs text-gray-400 mt-1">{selectedLead.company || '-'}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,45,74,0.7)' }}>
                <div className="text-xs text-gray-500">Telegram</div>
                <div className="text-sm text-white mt-1">ID: {selectedLead.telegram_user_id}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {selectedLead.telegram_username ? `@${selectedLead.telegram_username}` : '-'}
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,45,74,0.7)' }}>
                <div className="text-xs text-gray-500">Aloqa</div>
                <div className="text-sm text-white mt-1">{selectedLead.phone || '-'}</div>
                <div className="text-xs text-gray-400 mt-1">{selectedLead.email || '-'}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,45,74,0.7)' }}>
                <div className="text-xs text-gray-500">Loyiha</div>
                <div className="text-sm text-white mt-1">{selectedLead.project_type || '-'}</div>
                <div className="text-xs text-gray-400 mt-1">Byudjet: {selectedLead.budget || '-'}</div>
                <div className="text-xs text-gray-400 mt-1">Muddat: {selectedLead.deadline || '-'}</div>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(0,87,255,0.07)', border: '1px solid rgba(0,87,255,0.2)' }}>
              <div className="text-xs text-gray-500 mb-2">Batafsil tavsif</div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedLead.description || '-'}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className={statusClass[selectedLead.status]}>{statusLabel[selectedLead.status]}</span>
              <div className="flex gap-2">
                <select
                  className="form-input text-sm py-2"
                  value={selectedLead.status}
                  onChange={(e) => {
                    const next = e.target.value as LeadStatus
                    void updateStatus(selectedLead.id, next)
                    setSelectedLead((prev) => (prev ? { ...prev, status: next } : prev))
                  }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
