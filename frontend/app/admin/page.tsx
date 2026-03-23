'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Noto\'g\'ri email yoki parol')
      
      const json = await res.json()
      if (json.data && json.data.token) {
        document.cookie = `admin_token=${json.data.token}; path=/; max-age=86400`
      }
      
      toast.success('Xush kelibsiz!')
      router.push('/admin/dashboard')
    } catch (err: any) {
      // Demo login
      if (email === 'admin@primestack.uz' && password === 'admin123') {
        toast.success('Xush kelibsiz!')
        router.push('/admin/dashboard')
        return
      }
      toast.error(err.message || 'Kirish xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,87,255,0.08), transparent 70%)' }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-primary-500 rounded-lg rotate-45" />
              <div className="absolute inset-1 bg-accent-400 rounded-md rotate-45 opacity-70" />
            </div>
            <span className="font-display font-bold text-2xl text-white">PRIME<span className="text-primary-400">STACK</span></span>
          </div>
          <p className="text-gray-500 text-sm mt-3">Admin panel — faqat ruxsat berilganlar uchun</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl" style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(26,45,74,0.8)' }}>
          <h2 className="font-display font-semibold text-white text-xl mb-6">Tizimga kirish</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primestack.uz"
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Parol</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-12 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kirilmoqda...</>
              ) : 'Kirish'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-600 mt-4">
            Demo: admin@primestack.uz / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
