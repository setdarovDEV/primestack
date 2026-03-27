'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Settings, Users, FolderOpen, Briefcase, FileText,
  MessageSquare, Image as ImageIcon, ChevronLeft, ChevronRight, LogOut, Bell, X,
  Menu, Code2, Bot, Shield, User, ChevronDown
} from 'lucide-react'
import { adminApiFetch, apiFetch } from '@/lib/api'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/services', icon: Code2, label: 'Xizmatlar' },
  { href: '/admin/projects', icon: FolderOpen, label: 'Loyihalar' },
  { href: '/admin/team', icon: Users, label: 'Jamoa' },
  { href: '/admin/blog', icon: FileText, label: 'Blog' },
  { href: '/admin/vacancies', icon: Briefcase, label: 'Vakansiyalar' },
  { href: '/admin/messages', icon: MessageSquare, label: 'Xabarlar' },
  { href: '/admin/bot-leads', icon: Bot, label: 'Bot leadlar' },
  { href: '/admin/telegram-admins', icon: Shield, label: 'Bot adminlar' },
  { href: '/admin/media', icon: ImageIcon, label: 'Media' },
  { href: '/admin/settings', icon: Settings, label: 'Sozlamalar' },
]

type NewMessageItem = {
  id: number
  name: string
  company: string
  message: string
  source_page: string
  status: string
  created_at: string
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [newMessages, setNewMessages] = useState<NewMessageItem[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<number | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const lastCountRef = useRef<number>(-1)
  const profileRef = useRef<HTMLDivElement>(null)
  const isAuthPage = pathname === '/admin' || pathname === '/admin/login'

  const handleLogout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // no-op
    }
    router.push('/admin/login')
    router.refresh()
  }

  useEffect(() => {
    if (isAuthPage) return

    let disposed = false

    const loadNewMessages = async (silent: boolean) => {
      if (!silent && !disposed) {
        setLoadingNotifications(true)
      }

      try {
        const res = await adminApiFetch('/api/v1/admin/messages?status=new&per_page=20')
        const json = await res.json()
        const rowsRaw = Array.isArray(json?.data?.data) ? json.data.data : []
        const rows: NewMessageItem[] = rowsRaw.map((item: any) => ({
          id: toSafeNumber(item?.id),
          name: toSafeString(item?.name) || 'No name',
          company: toSafeString(item?.company),
          message: toSafeString(item?.message),
          source_page: toSafeString(item?.source_page),
          status: toSafeString(item?.status),
          created_at: toSafeString(item?.created_at),
        }))
        if (disposed) return

        setNewMessages(rows)
        setNewMessageCount(rows.length)

        if (lastCountRef.current >= 0 && rows.length > lastCountRef.current) {
          const delta = rows.length - lastCountRef.current
          toast.success(`${delta} ta yangi xabar keldi`)
        }
        lastCountRef.current = rows.length
      } catch {
        if (disposed) return
      } finally {
        if (!silent && !disposed) {
          setLoadingNotifications(false)
        }
      }
    }

    void loadNewMessages(true)
    const intervalId = window.setInterval(() => {
      void loadNewMessages(true)
    }, 15000)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [isAuthPage])

  useEffect(() => {
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const refreshNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const res = await adminApiFetch('/api/v1/admin/messages?status=new&per_page=20')
      const json = await res.json()
      const rowsRaw = Array.isArray(json?.data?.data) ? json.data.data : []
      const rows: NewMessageItem[] = rowsRaw.map((item: any) => ({
        id: toSafeNumber(item?.id),
        name: toSafeString(item?.name) || 'No name',
        company: toSafeString(item?.company),
        message: toSafeString(item?.message),
        source_page: toSafeString(item?.source_page),
        status: toSafeString(item?.status),
        created_at: toSafeString(item?.created_at),
      }))
      setNewMessages(rows)
      setNewMessageCount(rows.length)
      lastCountRef.current = rows.length
    } catch {
      toast.error('Yangi xabarlarni yuklab bo‘lmadi')
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleNotificationsClick = async () => {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    if (nextOpen) {
      await refreshNotifications()
    }
  }

  const markAsRead = async (id: number) => {
    setMarkingReadId(id)
    try {
      await adminApiFetch(`/api/v1/admin/messages/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'read' }),
      })
      setNewMessages((prev) => prev.filter((m) => m.id !== id))
      setNewMessageCount((prev) => Math.max(prev - 1, 0))
      toast.success("Xabar o'qilganlarga o'tdi")
    } catch {
      toast.error("Xabar statusini yangilab bo'lmadi")
    } finally {
      setMarkingReadId(null)
    }
  }

  if (isAuthPage) {
    return <>{children}</>
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-navy-border ${collapsed ? 'justify-center' : ''}`}>
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute inset-0 bg-primary-500 rounded-lg rotate-45" />
          <div className="absolute inset-1 bg-accent-400 rounded-md rotate-45 opacity-70" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white">PRIME<span className="text-primary-400">STACK</span></span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              style={active ? { background: 'rgba(0,87,255,0.15)', border: '1px solid rgba(0,87,255,0.25)' } : {}}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={active ? 'text-primary-400' : ''} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-navy-border">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Chiqish</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col flex-shrink-0 admin-sidebar overflow-hidden"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-10 rounded-r-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
          style={{ background: 'rgba(15,30,53,0.95)', border: '1px solid rgba(26,45,74,0.8)', borderLeft: 'none', marginLeft: '-1px' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-64 flex flex-col admin-sidebar z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-navy-border flex-shrink-0"
          style={{ background: 'rgba(8,14,31,0.95)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { void handleNotificationsClick() }}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.6)' }}>
              <Bell size={16} />
              {newMessageCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {newMessageCount > 99 ? '99+' : newMessageCount}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500/60" />
              )}
            </button>
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ border: '1px solid rgba(26,45,74,0.6)', background: 'rgba(15,30,53,0.6)' }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-navy-border bg-black/30 flex items-center justify-center">
                  <Image src="/brand/primelogo.png" alt="PrimeStack" width={36} height={36} className="object-cover" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs text-gray-500 leading-tight">Admin</span>
                  <span className="text-sm font-semibold text-white leading-tight">PrimeStack</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
                    style={{ background: 'rgba(8,14,31,0.98)', border: '1px solid rgba(26,45,74,0.9)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
                  >
                    <div className="px-4 py-3 border-b border-navy-border">
                      <p className="text-sm font-semibold text-white">PrimeStack</p>
                      <p className="text-xs text-gray-500">Premium IT Solutions</p>
                    </div>
                    <div className="py-1 text-sm text-gray-200">
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings size={15} className="text-gray-400" />
                        Sozlamalar
                      </Link>
                      <Link
                        href="/admin/settings#profile"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User size={15} className="text-gray-400" />
                        Profil
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setProfileMenuOpen(false); void handleLogout() }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut size={15} />
                        Chiqish
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 z-40"
              onClick={() => setNotificationsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12, x: 12 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -8, x: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,14,31,0.98)', border: '1px solid rgba(26,45,74,0.9)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-navy-border">
                <div>
                  <p className="text-sm font-semibold text-white">Yangi xabarlar</p>
                  <p className="text-xs text-gray-500">{newMessageCount} ta yangi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loadingNotifications && (
                  <div className="px-4 py-6 text-sm text-gray-500 text-center">Yuklanmoqda...</div>
                )}

                {!loadingNotifications && newMessages.length === 0 && (
                  <div className="px-4 py-8 text-sm text-gray-500 text-center">
                    Hozircha yangi xabar yo&apos;q
                  </div>
                )}

                {!loadingNotifications && newMessages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={markingReadId === item.id}
                    onClick={() => { void markAsRead(item.id) }}
                    className="w-full text-left px-4 py-3 border-b border-navy-border hover:bg-white/[0.03] transition-colors disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <span className="text-[11px] text-gray-500 flex-shrink-0">{formatRelative(item.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.company || 'Kompaniya ko‘rsatilmagan'}</p>
                    <p className="text-xs text-gray-400 truncate mt-1">{item.message}</p>
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-navy-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { void refreshNotifications() }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Yangilash
                </button>
                <Link href="/admin/messages" className="text-xs text-primary-400 hover:text-primary-300">
                  Barchasi
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
