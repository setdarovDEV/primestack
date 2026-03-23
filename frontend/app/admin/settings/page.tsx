'use client'
import { useState, useCallback, useEffect } from 'react'
import { Save, Globe, Mail, Phone, MapPin, Twitter, Linkedin, Github, Instagram, Youtube, Loader2, type LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApiFetch } from '@/lib/api'

interface SettingsInputProps {
  icon?: LucideIcon
  label: string
  field: string
  type?: string
  placeholder?: string
  value: string
  onChange: (field: string, value: string) => void
}

function SettingsInput({ icon: Icon, label, field, type = 'text', placeholder = '', value, onChange }: SettingsInputProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-4 h-4">
            <Icon size={14} className="text-gray-500" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`form-input text-sm ${Icon ? 'pl-12' : ''}`}
        />
      </div>
    </div>
  )
}

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'PRIMESTACK',
  tagline: 'Premium IT Solutions',
  email: 'hello@primestack.uz',
  phone: '+998 90 000 00 00',
  address: 'Toshkent, Yunusobod, IT Park',
  website: 'https://primestack.uz',
  twitter: 'https://twitter.com/primestack',
  linkedin: 'https://linkedin.com/company/primestack',
  github: 'https://github.com/primestack',
  instagram: 'https://instagram.com/primestack',
  youtube: 'https://youtube.com/@primestack',
  footer_text: '© 2026 PRIMESTACK. Barcha huquqlar himoyalangan.',
  google_analytics: '',
  telegram_notify: '@primestack_notify',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/settings')
        const json = await res.json()
        if (json.data) {
          setSettings(prev => ({ ...prev, ...json.data }))
        }
      } catch {
        // Use defaults if API fails
      } finally {
        setFetching(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = useCallback((field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await adminApiFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      toast.success('Sozlamalar saqlandi!')
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Sozlamalar</h1>
          <p className="text-gray-400 text-sm mt-0.5">Global sayt sozlamalari</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary text-sm py-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
          Saqlash
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-primary-400" /> Umumiy
          </h3>
          <div className="space-y-4">
            <SettingsInput label="Sayt nomi" field="site_name" placeholder="PRIMESTACK" value={settings.site_name} onChange={handleChange} />
            <SettingsInput label="Tagline" field="tagline" placeholder="Premium IT Solutions" value={settings.tagline} onChange={handleChange} />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Footer matni</label>
              <textarea value={settings.footer_text}
                onChange={e => handleChange('footer_text', e.target.value)}
                className="form-input text-sm resize-none" rows={2} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={16} className="text-primary-400" /> Aloqa
          </h3>
          <div className="space-y-4">
            <SettingsInput icon={Mail} label="Email" field="email" type="email" value={settings.email} onChange={handleChange} />
            <SettingsInput icon={Phone} label="Telefon" field="phone" value={settings.phone} onChange={handleChange} />
            <SettingsInput icon={MapPin} label="Manzil" field="address" value={settings.address} onChange={handleChange} />
            <SettingsInput icon={Globe} label="Sayt URL" field="website" value={settings.website} onChange={handleChange} />
          </div>
        </div>

        {/* Social */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Twitter size={16} className="text-primary-400" /> Ijtimoiy tarmoqlar
          </h3>
          <div className="space-y-4">
            <SettingsInput icon={Twitter} label="Twitter" field="twitter" value={settings.twitter} onChange={handleChange} />
            <SettingsInput icon={Linkedin} label="LinkedIn" field="linkedin" value={settings.linkedin} onChange={handleChange} />
            <SettingsInput icon={Github} label="GitHub" field="github" value={settings.github} onChange={handleChange} />
            <SettingsInput icon={Instagram} label="Instagram" field="instagram" value={settings.instagram} onChange={handleChange} />
            <SettingsInput icon={Youtube} label="YouTube" field="youtube" value={settings.youtube} onChange={handleChange} />
          </div>
        </div>

        {/* Integrations */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-primary-400" /> Integratsiyalar
          </h3>
          <div className="space-y-4">
            <SettingsInput label="Google Analytics ID" field="google_analytics" placeholder="G-XXXXXXXXXX" value={settings.google_analytics} onChange={handleChange} />
            <SettingsInput label="Telegram kanal (notifikatsiya)" field="telegram_notify" placeholder="@kanal_nomi" value={settings.telegram_notify} onChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
