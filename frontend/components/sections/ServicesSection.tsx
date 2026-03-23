'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Code2, Smartphone, Cloud, Palette, Database, Shield, Search, Bot, Cpu, LineChart, Megaphone,
} from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
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
  ai: Bot,
  bot: Bot,
  chatbot: Bot,
  automation: Cpu,
  analytics: LineChart,
}

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

  if (iconKey === '' || iconKey === 'code' || iconKey === 'code2') {
    if (title.includes('seo')) return Search
    if (title.includes('market')) return Megaphone
    if (title.includes('ai') || title.includes('chatbot') || title.includes('suniy')) return Bot
    if (title.includes('auto')) return Cpu
  }

  if (ICON_MAP[iconKey]) return ICON_MAP[iconKey]
  return Code2
}

export default function ServicesSection() {
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/services')
        if (!res.ok) return
        const json = await res.json()
        if (!Array.isArray(json.data)) return

        const colorRotation = ['#0057FF', '#00D4FF', '#7B2FFF', '#FF2D78', '#10B981', '#F59E0B']
        const mapped = json.data.map((item: any, idx: number) => ({
          icon: resolveIcon(item.icon, item.title),
          title: item.title,
          description: item.short_description || '',
          tags: parseContent(item.full_content).features.slice(0, 3),
          color: colorRotation[idx % colorRotation.length],
        }))
        if (mapped.length > 0) setServices(mapped)
      } catch {
        setServices([])
      }
    }
    load()
  }, [])

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-custom">
        <AnimatedSection className="text-center mb-16">
          <SectionBadge>Bizning xizmatlar</SectionBadge>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
            Kompleks IT <span className="gradient-text">yechimlar</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Ideyadan tayyor produktgacha barcha bosqichlarda professional qo'llab-quvvatlash.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl text-center text-gray-400"
              style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
              Hozircha xizmatlar mavjud emas
            </div>
          )}
          {services.map((service, i) => {
            const Icon = service.icon
            return (
              <AnimatedSection key={service.title} delay={i * 0.08} direction="up">
                <div
                  className="relative p-6 rounded-2xl card-hover h-full group"
                  style={{
                    background: 'rgba(15,30,53,0.6)',
                    border: '1px solid rgba(26,45,74,0.8)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: service.color + '18', border: `1px solid ${service.color}30` }}
                  >
                    <Icon size={22} style={{ color: service.color }} />
                  </div>

                  <h3 className="font-display font-semibold text-lg text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">{service.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-mono"
                        style={{ background: `${service.color}12`, color: service.color, border: `1px solid ${service.color}25` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `radial-gradient(circle at top left, ${service.color}08, transparent 60%)` }}
                  />
                </div>
              </AnimatedSection>
            )
          })}
        </div>

        <AnimatedSection className="text-center mt-10" delay={0.3}>
          <Link href="/services" className="btn-outline">
            Barcha xizmatlar
            <ArrowRight size={16} />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}
