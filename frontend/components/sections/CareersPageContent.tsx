'use client'

import { useEffect, useState } from 'react'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { MapPin, Clock, Briefcase, ArrowRight, Star, Zap, Heart, Coffee } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

const perks = [
  { icon: Star, title: 'Yuqori maosh', desc: 'Bozor narxidan 20-30% yuqori' },
  { icon: Zap, title: 'Zamonaviy stack', desc: "Go, Next.js, Flutter, AWS va eng so'nggi texnologiyalar" },
  { icon: Heart, title: "Sog'liq sug'urtasi", desc: "To'liq tibbiy va stomatologik sug'urta" },
  { icon: Coffee, title: 'Moslashuvchan jadval', desc: 'Remote/hybrid va 5 kun dam olish bonusi' },
]

const levelColor: Record<string, string> = {
  Senior: '#10B981',
  Middle: '#0057FF',
  'Middle/Senior': '#00D4FF',
  Junior: '#F59E0B',
  Lead: '#7B2FFF',
}

function deriveTags(vacancy: any) {
  const tags: string[] = []
  if (vacancy.department) tags.push(vacancy.department)
  if (vacancy.level) tags.push(vacancy.level)
  if (vacancy.location) tags.push(vacancy.location.includes('Remote') ? 'Remote' : 'Onsite')
  return Array.from(new Set(tags)).slice(0, 4)
}

export default function CareersPageContent() {
  const [vacancies, setVacancies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/vacancies')
        if (!res.ok) {
          setVacancies([])
          return
        }
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        setVacancies(data)
      } catch {
        setVacancies([])
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0057FF, transparent)', filter: 'blur(80px)' }} />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Vakansiyalar</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Ajoyib jamoaga <span className="gradient-text">qo&apos;shiling</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              PRIMESTACK&apos;da ishlash bu faqat kod yozish emas. Bu muhim mahsulotlar qurish, o&apos;sish va professional bo&apos;lish.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {perks.map((p, i) => {
              const Icon = p.icon
              return (
                <AnimatedSection key={p.title} delay={i * 0.08} className="h-full">
                  <div className="p-5 rounded-2xl text-center h-full min-h-[142px] flex flex-col justify-center"
                    style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(0,87,255,0.12)', border: '1px solid rgba(0,87,255,0.2)' }}>
                      <Icon size={18} className="text-primary-400" />
                    </div>
                    <h4 className="font-display font-semibold text-white text-sm mb-1">{p.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{p.desc}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom">
          <AnimatedSection className="mb-8">
            <h2 className="font-display font-bold text-2xl text-white">
              Ochiq pozitsiyalar <span className="text-primary-400 text-lg font-mono ml-2">({vacancies.length})</span>
            </h2>
          </AnimatedSection>

          {!loading && vacancies.length === 0 && (
            <AnimatedSection>
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Hozircha ochiq vakansiya yo&apos;q</h3>
                <p className="text-gray-400">Admin paneldan `Vakansiyalar` bo&apos;limida yangi ochiq vakansiya qo&apos;shing.</p>
              </div>
            </AnimatedSection>
          )}

          <div className="space-y-4">
            {vacancies.map((v: any, i: number) => (
              <AnimatedSection key={v.id || i} delay={i * 0.06}>
                <div className="p-6 rounded-2xl card-hover group" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-display font-semibold text-white text-lg group-hover:text-primary-300 transition-colors">
                          {v.title}
                        </h3>
                        <span className="badge-info">{v.department || 'General'}</span>
                        {v.level && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: `${levelColor[v.level] || '#0057FF'}15`,
                              color: levelColor[v.level] || '#0057FF',
                              border: `1px solid ${(levelColor[v.level] || '#0057FF')}25`,
                            }}>
                            {v.level}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3 max-w-xl">{v.description || 'Tavsif mavjud emas'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {v.location || 'Toshkent / Remote'}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> Full-time</span>
                        <span className="flex items-center gap-1"><Briefcase size={11} /> {v.department || 'General'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {deriveTags(v).map((t) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                    <Link href={v.apply_url || '/contact'} target={v.apply_url ? '_blank' : undefined} rel={v.apply_url ? 'noreferrer' : undefined}
                      className="flex-shrink-0 btn-primary text-sm py-2.5 group/btn">
                      Ariza yuborish
                      <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-8 text-center" delay={0.3}>
            <p className="text-gray-500 text-sm">
              Mos vakansiya topolmadingizmi?{' '}
              <Link href="/contact" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                Portfolio&apos;ingizni yuboring
              </Link>
              {' '} biz doimo iste&apos;dodli odamlarni izlaymiz.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  )
}
