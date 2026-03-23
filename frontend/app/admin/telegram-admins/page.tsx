'use client'
import { useEffect, useMemo, useState } from 'react'
import { Shield, Trash2, Plus, UserRound, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApiFetch } from '@/lib/api'

type TelegramAdmin = {
  id: number
  telegram_user_id: number
  display_name: string
  username: string
  is_active: boolean
  created_at: string
}

type NewAdminForm = {
  telegram_user_id: string
  display_name: string
  username: string
  is_active: boolean
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function safeNumber(v: unknown): number {
  return Number(v) || 0
}

function parseAdmin(item: any): TelegramAdmin {
  return {
    id: safeNumber(item?.id),
    telegram_user_id: safeNumber(item?.telegram_user_id),
    display_name: safeString(item?.display_name),
    username: safeString(item?.username),
    is_active: Boolean(item?.is_active),
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

export default function AdminTelegramAdminsPage() {
  const [admins, setAdmins] = useState<TelegramAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NewAdminForm>({
    telegram_user_id: '',
    display_name: '',
    username: '',
    is_active: true,
  })

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const res = await adminApiFetch('/api/v1/admin/telegram-admins')
      const json = await res.json()
      const rows = Array.isArray(json?.data) ? json.data : []
      setAdmins(rows.map(parseAdmin))
    } catch {
      setAdmins([])
      toast.error('Telegram adminlarni yuklab bo‘lmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const activeCount = useMemo(() => admins.filter((a) => a.is_active).length, [admins])
  const canCreateActive = activeCount < 3

  const createAdmin = async () => {
    const userID = Number(form.telegram_user_id)
    if (!Number.isFinite(userID) || userID <= 0) {
      toast.error("Telegram user ID noto'g'ri")
      return
    }
    if (form.is_active && !canCreateActive) {
      toast.error("Faol admin limiti to'lgan (3 ta)")
      return
    }

    setSaving(true)
    try {
      const res = await adminApiFetch('/api/v1/admin/telegram-admins', {
        method: 'POST',
        body: JSON.stringify({
          telegram_user_id: userID,
          display_name: form.display_name.trim(),
          username: form.username.trim().replace(/^@+/, ''),
          is_active: form.is_active,
        }),
      })
      const json = await res.json()
      setAdmins((prev) => [...prev, parseAdmin(json?.data)])
      setForm({ telegram_user_id: '', display_name: '', username: '', is_active: true })
      toast.success("Telegram admin qo'shildi")
    } catch (err: any) {
      toast.error(err?.message || "Telegram admin qo'shib bo'lmadi")
    } finally {
      setSaving(false)
    }
  }

  const deleteAdmin = async (id: number) => {
    try {
      await adminApiFetch(`/api/v1/admin/telegram-admins/${id}`, { method: 'DELETE' })
      setAdmins((prev) => prev.filter((a) => a.id !== id))
      toast.success("Telegram admin o'chirildi")
    } catch {
      toast.error("Telegram adminni o'chirib bo'lmadi")
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Bot Adminlar</h1>
        <p className="text-gray-400 text-sm mt-1">
          Telegram bot adminlariga faqat Telegram User ID bo&apos;yicha ruxsat beriladi. Faol limit: {activeCount}/3.
        </p>
      </div>

      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Telegram User ID *</label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="number"
                value={form.telegram_user_id}
                onChange={(e) => setForm((f) => ({ ...f, telegram_user_id: e.target.value }))}
                className="form-input pl-10 text-sm"
                placeholder="123456789"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Ism</label>
            <div className="relative">
              <UserRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                className="form-input pl-10 text-sm"
                placeholder="Ali Valiyev"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="form-input text-sm"
              placeholder="@username"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Faol
            </label>
            <button
              onClick={createAdmin}
              disabled={saving || (form.is_active && !canCreateActive)}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Qo&apos;shish
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(26,45,74,0.8)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,30,53,0.9)', borderBottom: '1px solid rgba(26,45,74,0.8)' }}>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Holat</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Qo&apos;shilgan</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,45,74,0.5)]">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500" style={{ background: 'rgba(15,30,53,0.6)' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500" style={{ background: 'rgba(15,30,53,0.6)' }}>
                    Hozircha admin ID yo&apos;q
                  </td>
                </tr>
              )}
              {!loading && admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors" style={{ background: 'rgba(15,30,53,0.6)' }}>
                  <td className="px-4 py-3 text-sm text-white font-mono">{admin.telegram_user_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div>{admin.display_name || '-'}</div>
                    <div className="text-xs text-gray-500">{admin.username ? `@${admin.username}` : '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {admin.is_active ? (
                      <span className="inline-flex items-center gap-1 badge-success"><Shield size={11} /> Faol</span>
                    ) : (
                      <span className="badge-warning">Nofaol</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatDate(admin.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => void deleteAdmin(admin.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="O'chirish"
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
    </div>
  )
}
