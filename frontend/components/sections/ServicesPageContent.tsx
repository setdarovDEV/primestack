'use client'

import { useEffect, useState } from 'react'
import {
  Code2, Smartphone, Cloud, Palette, Database, Shield, Search, Bot, Cpu, LineChart, Megaphone, ArrowRight, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { apiFetch } from '@/lib/api'

const ICON_MAP: Record<string, any> = {
  code2: Code2,
  code: Code2,
  web: Code2,
  smartphone: Smartphone,
  mobile: Smartphone,
  cloud: Cloud,
  palette: Palette,
  design: Palette,
  database: Database,
  backend: Database,
  shield: Shield,
  security: Shield,
  seo: Search,
  search: Search,
  marketing: Megaphone,
  chart: LineChart,
  ai: Bot,
  bot: Bot,
  chatbot: Bot,
  cpu: Cpu,
  automation: Cpu,
  analytics: LineChart,
}

const COLORS = ['#0057FF', '#00D4FF', '#7B2FFF', '#FF2D78', '#10B981', '#F59E0B']

function parseContent(fullContent?: string) {
  if (!fullContent) return { features: [] as string[], useCases: [] as string[] }
  try {
    const parsed = JSON.parse(fullContent)
    return {
      features: Array.isArray(parsed.features) ? parsed.features : [],
      useCases: Array.isArray(parsed.use_cases) ? parsed.use_cases : [],
    }
  } catch {
    return { features: [], useCases: [] }
  }
}

function resolveIcon(iconRaw: string | undefined, titleRaw: string | undefined) {
  const iconKey = String(iconRaw || '').toLowerCase().trim()
  const title = String(titleRaw || '').toLowerCase()
  // "code" default bo'lib qolgan eski yozuvlarda title bo'yicha aqlli tanlash.
  if (iconKey === '' || iconKey === 'code' || iconKey === 'code2') {
    if (title.includes('seo')) return Search
    if (title.includes('market')) return Megaphone
    if (title.includes('ai') || title.includes('chatbot') || title.includes('suniy')) return Bot
    if (title.includes('auto')) return Cpu
  }

  if (ICON_MAP[iconKey]) return ICON_MAP[iconKey]

  if (title.includes('seo')) return Search
  if (title.includes('market')) return Megaphone
  if (title.includes('ai') || title.includes('chatbot') || title.includes('suniy')) return Bot
  if (title.includes('auto')) return Cpu
  return Code2
}

export default function ServicesPageContent() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/services')
        if (!res.ok) {
          setServices([])
          return
        }
        const json = await res.json()
        setServices(Array.isArray(json.data) ? json.data : [])
      } catch {
        setServices([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PublicLayout>
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Xizmatlar</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Kompleks <span className="gradient-text">IT yechimlar</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Ideyadan production deploymentgacha barcha bosqichlarda professional xizmat. Sizning biznesingiz o'sishi uchun ishlaydi.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom space-y-8">
          {!loading && services.length === 0 && (
            <AnimatedSection>
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Hozircha xizmatlar yo'q</h2>
                <p className="text-gray-400">Admin paneldan yangi xizmat qo'shganingizdan keyin shu yerda ko'rinadi.</p>
              </div>
            </AnimatedSection>
          )}

          {services.map((s, i) => {
            const color = COLORS[i % COLORS.length]
            const Icon = resolveIcon(s.icon, s.title)
            const parsed = parseContent(s.full_content)
            return (
              <AnimatedSection key={s.id || s.slug || s.title} delay={0.1}>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,30,53,0.6)', border: `1px solid ${color}20` }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="p-8 md:p-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        <Icon size={26} style={{ color }} />
                      </div>
                      <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">{s.title}</h2>
                      <p className="text-gray-400 leading-relaxed mb-6">{s.short_description}</p>
                      <Link href="/contact" className="btn-primary inline-flex text-sm py-2.5" style={{ background: color }}>
                        So'rov yuborish <ArrowRight size={15} />
                      </Link>
                    </div>

                    <div className="p-8 md:p-10 border-t lg:border-t-0 lg:border-l" style={{ borderColor: `${color}15` }}>
                      <div className="mb-6">
                        <h4 className="text-xs uppercase tracking-widest font-mono mb-3" style={{ color }}>
                          Imkoniyatlar
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(parsed.features || []).map((f: string) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                              <CheckCircle2 size={13} style={{ color, flexShrink: 0 }} />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs uppercase tracking-widest font-mono mb-3 text-gray-500">Qo'llanilishi</h4>
                        <div className="flex flex-wrap gap-2">
                          {(parsed.useCases || []).map((u: string) => (
                            <span key={u} className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  )
}
