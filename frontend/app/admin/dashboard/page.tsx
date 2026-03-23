'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FolderOpen, MessageSquare, Briefcase, ArrowUpRight, Activity } from 'lucide-react'
import Link from 'next/link'
import { adminApiFetch } from '@/lib/api'

type DashboardMessage = {
  id: number
  name: string
  company: string
  message: string
  status: string
  source_page: string
  created_at: string
}

type DashboardData = {
  messages_count: number
  messages_this_week: number
  new_messages_count: number
  projects_count: number
  projects_this_month: number
  team_count: number
  team_this_month: number
  vacancies_open_count: number
  vacancies_count: number
  recent_messages: DashboardMessage[]
  system_status: {
    api: string
    database: string
    storage: string
    cdn: string
  }
}

const DEFAULT_DASHBOARD: DashboardData = {
  messages_count: 0,
  messages_this_week: 0,
  new_messages_count: 0,
  projects_count: 0,
  projects_this_month: 0,
  team_count: 0,
  team_this_month: 0,
  vacancies_open_count: 0,
  vacancies_count: 0,
  recent_messages: [],
  system_status: {
    api: 'OK',
    database: 'OK',
    storage: 'OK',
    cdn: 'OK',
  },
}

function toSafeString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function toSafeNumber(v: unknown): number {
  return Number(v) || 0
}

function formatRelative(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 60 * 1000) return 'Hozirgina'
  const mins = Math.floor(diffMs / (60 * 1000))
  if (mins < 60) return `${mins} min oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  if (hours < 48) return 'Kecha'
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseDashboard(input: any): DashboardData {
  const system = input?.system_status || {}
  const messagesRaw = Array.isArray(input?.recent_messages) ? input.recent_messages : []

  return {
    messages_count: toSafeNumber(input?.messages_count),
    messages_this_week: toSafeNumber(input?.messages_this_week),
    new_messages_count: toSafeNumber(input?.new_messages_count),
    projects_count: toSafeNumber(input?.projects_count),
    projects_this_month: toSafeNumber(input?.projects_this_month),
    team_count: toSafeNumber(input?.team_count),
    team_this_month: toSafeNumber(input?.team_this_month),
    vacancies_open_count: toSafeNumber(input?.vacancies_open_count),
    vacancies_count: toSafeNumber(input?.vacancies_count),
    recent_messages: messagesRaw.map((m: any) => ({
      id: toSafeNumber(m?.id),
      name: toSafeString(m?.name),
      company: toSafeString(m?.company),
      message: toSafeString(m?.message),
      status: toSafeString(m?.status) || 'new',
      source_page: toSafeString(m?.source_page),
      created_at: toSafeString(m?.created_at),
    })),
    system_status: {
      api: toSafeString(system?.api) || 'OK',
      database: toSafeString(system?.database) || 'OK',
      storage: toSafeString(system?.storage) || 'OK',
      cdn: toSafeString(system?.cdn) || 'OK',
    },
  }
}

const statusBadge: Record<string, string> = {
  new: 'badge-info',
  read: 'badge-warning',
  replied: 'badge-success',
  spam: 'badge-danger',
}
const statusLabel: Record<string, string> = {
  new: 'Yangi',
  read: 'Ko\'rildi',
  replied: 'Javob berildi',
  spam: 'Spam',
}

const quickLinks = [
  { href: '/admin/blog', label: 'Yangi maqola', color: '#0057FF' },
  { href: '/admin/services', label: 'Xizmat qo\'shish', color: '#00D4FF' },
  { href: '/admin/vacancies', label: 'Vakansiya qo\'shish', color: '#10B981' },
  { href: '/admin/team', label: 'A\'zo qo\'shish', color: '#7B2FFF' },
]

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>(DEFAULT_DASHBOARD)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await adminApiFetch('/api/v1/admin/dashboard')
        const json = await res.json()
        setDashboard(parseDashboard(json?.data))
      } catch {
        setDashboard(DEFAULT_DASHBOARD)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => [
    {
      label: 'Jami xabarlar',
      value: String(dashboard.messages_count),
      change: `+${dashboard.messages_this_week} bu hafta`,
      icon: MessageSquare,
      color: '#0057FF',
      href: '/admin/messages',
    },
    {
      label: 'Loyihalar',
      value: String(dashboard.projects_count),
      change: `+${dashboard.projects_this_month} bu oy`,
      icon: FolderOpen,
      color: '#00D4FF',
      href: '/admin/projects',
    },
    {
      label: "Jamoa a'zolari",
      value: String(dashboard.team_count),
      change: `+${dashboard.team_this_month} bu oy`,
      icon: Users,
      color: '#7B2FFF',
      href: '/admin/team',
    },
    {
      label: 'Ochiq vakansiyalar',
      value: String(dashboard.vacancies_open_count),
      change: `Jami ${dashboard.vacancies_count}`,
      icon: Briefcase,
      color: '#10B981',
      href: '/admin/vacancies',
    },
  ], [dashboard])

  const systemItems = [
    { label: 'API', status: dashboard.system_status.api },
    { label: 'Database', status: dashboard.system_status.database },
    { label: 'Storage', status: dashboard.system_status.storage },
    { label: 'CDN', status: dashboard.system_status.cdn },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Ma'lumotlar yuklanmoqda..." : "Xush kelibsiz! Bu yerda umumiy ko'rinish."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={s.href}>
                <div className="p-5 rounded-2xl card-hover cursor-pointer"
                  style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <ArrowUpRight size={14} className="text-gray-600" />
                  </div>
                  <div className="font-display font-bold text-2xl text-white mb-0.5">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-xs mt-2" style={{ color: s.color }}>{s.change}</div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-border">
              <h3 className="font-display font-semibold text-white text-sm">So'nggi xabarlar</h3>
              <Link href="/admin/messages" className="text-xs text-primary-400 hover:text-primary-300">Barchasi →</Link>
            </div>
            <div className="divide-y divide-navy-border">
              {dashboard.recent_messages.length === 0 && (
                <div className="px-5 py-8 text-sm text-gray-500 text-center">
                  Hozircha xabarlar yo&apos;q
                </div>
              )}
              {dashboard.recent_messages.map((m) => (
                <div key={`${m.id}-${m.created_at}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {(m.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{m.name}</span>
                      <span className="text-xs text-gray-500 truncate">{m.company || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{m.message}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={statusBadge[m.status] || 'badge-warning'}>{statusLabel[m.status] || m.status}</span>
                    <span className="text-xs text-gray-600">{formatRelative(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-2xl p-5" style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
            <h3 className="font-display font-semibold text-white text-sm mb-4">Tezkor harakatlar</h3>
            <div className="space-y-2">
              {quickLinks.map((ql) => (
                <Link key={ql.href} href={ql.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:translate-x-1"
                  style={{ background: `${ql.color}10`, border: `1px solid ${ql.color}20` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: ql.color }} />
                  <span className="text-sm font-medium" style={{ color: ql.color }}>{ql.label}</span>
                </Link>
              ))}
            </div>

            {/* Site activity */}
            <div className="mt-5 pt-5 border-t border-navy-border">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-primary-400" />
                <span className="text-xs font-mono text-gray-400">Tizim holati</span>
              </div>
              {systemItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-mono flex items-center gap-1"
                    style={{ color: item.status === 'OK' ? '#10B981' : '#EF4444' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status || 'UNKNOWN'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
