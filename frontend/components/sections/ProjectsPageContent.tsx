'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { apiFetch } from '@/lib/api'

const FALLBACK_GRADIENTS = [
  'from-blue-700 to-cyan-500',
  'from-purple-700 to-pink-500',
  'from-emerald-700 to-teal-500',
  'from-orange-600 to-red-500',
  'from-indigo-700 to-blue-500',
  'from-sky-700 to-violet-500',
]

export default function ProjectsPageContent() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/projects')
        if (!res.ok) {
          setProjects([])
          return
        }
        const json = await res.json()
        if (!Array.isArray(json.data)) {
          setProjects([])
          return
        }
        const mapped = json.data.map((item: any, idx: number) => ({
          title: item.title,
          client: item.client || 'Mijoz',
          category: item.category || 'General',
          tags: String(item.tech_stack || '')
            .split(',')
            .map((v: string) => v.trim())
            .filter(Boolean)
            .slice(0, 5),
          result: item.result_kpi || item.summary || '',
          year: item.year || '',
          gradient: FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length],
        }))
        setProjects(mapped)
      } catch {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PublicLayout>
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Portfolio</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Real natijalar, <span className="gradient-text">haqiqiy ishlar</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              120+ muvaffaqiyatli loyihalardan ba&apos;zilari. Har bir loyiha texnik mukammallik va biznes natijalari kombinatsiyasi.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom">
          {!loading && projects.length === 0 && (
            <AnimatedSection>
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Hozircha portfolio yo&apos;q</h2>
                <p className="text-gray-400">Admin panelda `published` holatda loyiha qo&apos;shilgach shu yerda ko&apos;rinadi.</p>
              </div>
            </AnimatedSection>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p, i) => (
              <AnimatedSection key={`${p.title}-${i}`} delay={i * 0.07}>
                <div className="rounded-2xl overflow-hidden card-hover group h-full flex flex-col"
                  style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
                  <div className={`relative h-52 bg-gradient-to-br ${p.gradient} flex-shrink-0`}>
                    <div className="absolute inset-0 grid-bg opacity-20" />
                    <div className="absolute inset-0 flex items-end p-5">
                      <div>
                        <span className="text-xs font-mono text-white/60 block mb-1">{p.year} · {p.category}</span>
                        <h3 className="font-display font-bold text-xl text-white">{p.title}</h3>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                        <ExternalLink size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 mb-2 font-mono">{p.client}</div>
                    <div className="text-sm text-gray-300 mb-4 leading-relaxed flex-1">{p.result}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((tag: string) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  )
}

