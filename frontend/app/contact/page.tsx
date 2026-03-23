'use client'
import { useEffect, useState } from 'react'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'
import {
  DEFAULT_PUBLIC_SETTINGS,
  fetchPublicSettings,
  getMailHref,
  getMapHref,
  getPhoneHref,
  getTelegramHref,
  type PublicSettings,
} from '@/lib/publicSettings'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS)

  useEffect(() => {
    let active = true
    const load = async () => {
      const next = await fetchPublicSettings()
      if (active) setSettings(next)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring")
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source_page: '/contact' }),
      })
      if (!res.ok) throw new Error('Server xatosi')
      toast.success("Xabaringiz yuborildi! Tez orada bog'lanamiz.")
      setFormData({ name: '', company: '', email: '', phone: '', message: '' })
    } catch {
      toast.error("Xabar yuborilmadi. Qaytadan urinib ko'ring.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Bog'lanish</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Loyihangiz haqida <span className="gradient-text">gaplashaylik</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Bepul konsultatsiya uchun murojaat qiling. 24 soat ichida javob beramiz.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="space-y-5">
              <AnimatedSection>
                <div className="p-6 rounded-2xl" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                  <h3 className="font-display font-semibold text-white mb-4">Aloqa ma'lumotlari</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Mail, label: 'Email', value: settings.email, href: getMailHref(settings.email) },
                      { icon: Phone, label: 'Telefon', value: settings.phone, href: getPhoneHref(settings.phone) },
                      { icon: MapPin, label: 'Manzil', value: settings.address, href: getMapHref(settings.address) },
                      { icon: Clock, label: 'Ish vaqti', value: 'Dushanba-Juma: 09:00-18:00', href: '#' },
                    ].map((c) => {
                      const Icon = c.icon
                      return (
                        <a key={c.label} href={c.href}
                          className="flex items-start gap-3 group">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(0,87,255,0.12)', border: '1px solid rgba(0,87,255,0.2)' }}>
                            <Icon size={15} className="text-primary-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">{c.label}</div>
                            <div className="text-sm text-gray-300 group-hover:text-white transition-colors">{c.value}</div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <a href={getTelegramHref(settings.telegram_notify)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.25)' }}>
                  <MessageSquare size={20} className="text-sky-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Telegram orqali</div>
                    <div className="text-xs text-gray-500">{settings.telegram_notify || '@Primestackuz'}</div>
                  </div>
                </a>
              </AnimatedSection>
            </div>

            {/* Form */}
            <AnimatedSection className="lg:col-span-2" delay={0.1}>
              <div className="p-8 rounded-2xl" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h3 className="font-display font-semibold text-white mb-6">So'rov yuborish</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Ism *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alisher Nazarov"
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Kompaniya</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="PRIMESTACK"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alisher@company.uz"
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Telefon</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+998 90 000 00 00"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Xabar *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Loyihangiz haqida ma'lumot bering — nima kerak, qachon kerak, byudjet qanday..."
                      rows={5}
                      className="form-input resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Xabar yuborish
                      </>
                    )}
                  </button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
