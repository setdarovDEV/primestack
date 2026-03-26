'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import { apiFetch } from '@/lib/api'

const fallbackProjects = [
  {
    title: 'FinTech Platform',
    client: 'Kapital Bank',
    description: 'To\'liq bank operatsiyalari uchun zamonaviy web va mobil platforma.',
    tags: ['Next.js', 'Go', 'PostgreSQL'],
    gradient: 'from-blue-600 to-cyan-400',
    metric: '2M+ foydalanuvchi',
  },
  {
    title: 'E-Commerce Hub',
    client: 'Uzum Market',
    description: 'Millionlab mahsulotlar uchun skalalanadigan e-commerce yechim.',
    tags: ['React', 'Node.js', 'Redis'],
    gradient: 'from-purple-600 to-pink-400',
    metric: '$50M+ aylanma',
  },
  {
    title: 'SaaS Dashboard',
    client: 'LogiTrack Pro',
    description: 'Real-time logistika monitoringi va boshqaruv tizimi.',
    tags: ['TypeScript', 'WebSocket', 'AWS'],
    gradient: 'from-green-600 to-teal-400',
    metric: '99.9% uptime',
  },
]

export default function ProjectsSection() {
  const [projects, setProjects] = useState(fallbackProjects)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/projects')
        if (!res.ok) return
        const json = await res.json()
        if (!Array.isArray(json.data)) return
        const gradients = [
          'from-blue-600 to-cyan-400',
          'from-purple-600 to-pink-400',
          'from-green-600 to-teal-400',
        ]
        const mapped = json.data.map((item: any, idx: number) => ({
          title: item.title,
          client: item.client || 'Mijoz',
          description: item.summary || '',
          tags: (item.tech_stack || '')
            .split(',')
            .map((v: string) => v.trim())
            .filter(Boolean)
            .slice(0, 4),
          gradient: gradients[idx % gradients.length],
          metric: item.result_kpi || item.year || '',
        }))
        if (mapped.length > 0) setProjects(mapped)
      } catch {
        // keep fallback
      }
    }
    load()
  }, [])

  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="container-custom relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <AnimatedSection>
            <SectionBadge>Portfolio</SectionBadge>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white leading-[1.22] pb-1">
              So'nggi <span className="gradient-text">ishlarimiz</span>
            </h2>
          </AnimatedSection>
          <AnimatedSection direction="right">
            <Link href="/projects" className="btn-outline text-sm">
              Barchasini ko'rish
              <ArrowRight size={16} />
            </Link>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <AnimatedSection key={project.title} delay={i * 0.1}>
              <div className="relative rounded-2xl overflow-hidden card-hover group h-full flex flex-col"
                style={{ border: '1px solid rgba(26,45,74,0.8)' }}>
                {/* Image/Gradient placeholder */}
                <div className={`relative h-48 bg-gradient-to-br ${project.gradient} overflow-hidden`}>
                  <div className="absolute inset-0 grid-bg opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-bold text-2xl text-white/90 text-center px-4">
                      {project.title}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-mono text-white/70 glass px-2 py-1 rounded-full">
                      {project.metric}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col" style={{ background: 'rgba(15,30,53,0.9)' }}>
                  <div className="text-xs text-gray-500 mb-1 font-mono">{project.client}</div>
                  <h3 className="font-display font-semibold text-white mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 leading-relaxed line-clamp-4">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.tags.map((tag) => (
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
  )
}
