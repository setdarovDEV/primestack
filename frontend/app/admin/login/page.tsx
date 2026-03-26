'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'

const TWO_FA_TARGET_EMAIL = 'abbossetdarov3@gmail.com'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [otpExpiresIn, setOtpExpiresIn] = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        // no-op
      }

      if (!res.ok) {
        throw new Error(json?.error || "Noto'g'ri email yoki parol")
      }

      const nextChallengeId = String(json?.data?.challenge_id || '')
      if (!nextChallengeId) {
        throw new Error('2FA challenge topilmadi')
      }

      setChallengeId(nextChallengeId)
      setOtpExpiresIn(Number(json?.data?.expires_in) || 0)
      setOtpCode('')
      setStep('verify')
      toast.success(`2FA kod ${TWO_FA_TARGET_EMAIL} emailiga yuborildi`)
    } catch (err: any) {
      toast.error(err?.message || 'Kirish xatosi')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, code: otpCode.trim() }),
      })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        // no-op
      }

      if (!res.ok) {
        throw new Error(json?.error || '2FA tasdiqlashda xatolik')
      }

      toast.success('Xush kelibsiz!')
      router.replace('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || '2FA xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,87,255,0.08), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-primary-500 rounded-lg rotate-45" />
              <div className="absolute inset-1 bg-accent-400 rounded-md rotate-45 opacity-70" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              PRIME<span className="text-primary-400">STACK</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-3">Admin panel — faqat ruxsat berilganlar uchun</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(26,45,74,0.8)' }}>
          {step === 'credentials' ? (
            <>
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
                      placeholder="tmp@gmail.com"
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
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Tekshirilmoqda...
                    </>
                  ) : (
                    'Davom etish'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display font-semibold text-white text-xl mb-2">2FA tasdiqlash</h2>
              <p className="text-xs text-gray-400 mb-6">
                Kod faqat <span className="text-gray-200">{TWO_FA_TARGET_EMAIL}</span> emailiga yuboriladi.
              </p>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tasdiqlash kodi</label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="form-input pl-12 tracking-[0.35em]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      minLength={6}
                      maxLength={6}
                      required
                    />
                  </div>
                  {otpExpiresIn > 0 && (
                    <p className="text-[11px] text-gray-500 mt-2">Kodning amal qilish vaqti: {Math.ceil(otpExpiresIn / 60)} daqiqa</p>
                  )}
                </div>
                <button type="submit" disabled={loading || otpCode.length < 6} className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Tasdiqlanmoqda...
                    </>
                  ) : (
                    'Kodni tasdiqlash'
                  )}
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-200"
                  onClick={() => {
                    setStep('credentials')
                    setOtpCode('')
                    setChallengeId('')
                    setOtpExpiresIn(0)
                  }}
                >
                  <ArrowLeft size={14} /> Orqaga qaytish
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
