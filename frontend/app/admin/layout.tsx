'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Settings, Users, FolderOpen, Briefcase, FileText,
  MessageSquare, Image, Search, ChevronLeft, ChevronRight, LogOut, Bell,
  Menu, X, Code2, Bot, Shield
} from 'lucide-react'

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
  { href: '/admin/media', icon: Image, label: 'Media' },
  { href: '/admin/settings', icon: Settings, label: 'Sozlamalar' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/admin')
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
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(26,45,74,0.8)', minWidth: 200 }}>
              <Search size={14} className="text-gray-500" />
              <span className="text-sm text-gray-500">Qidirish...</span>
              <span className="ml-auto text-xs text-gray-600 font-mono">⌘K</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.6)' }}>
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">A</div>
              <span className="hidden md:block text-sm text-gray-300">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
