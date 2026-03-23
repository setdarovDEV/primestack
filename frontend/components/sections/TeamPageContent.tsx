'use client'

import { useEffect, useMemo, useState } from 'react'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { Linkedin, Github, Globe } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const COLORS = ['#0057FF', '#00D4FF', '#7B2FFF', '#10B981', '#FF2D78', '#F59E0B']

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function deriveSkills(member: any) {
  const skills: string[] = []
  if (member.department) skills.push(member.department)
  if (member.position) skills.push(member.position.split(' ')[0])
  if (member.linkedin_url) skills.push('LinkedIn')
  if (member.github_url) skills.push('GitHub')
  return Array.from(new Set(skills)).slice(0, 3)
}

function Avatar({ initials, color, size = 'lg' }: { initials: string; color: string; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-14 h-14 text-sm'
  return (
    <div className={`${dim} rounded-2xl flex items-center justify-center font-display font-bold text-white flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, boxShadow: `0 8px 24px ${color}30` }}>
      {initials}
    </div>
  )
}

export default function TeamPageContent() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/team')
        if (!res.ok) {
          setMembers([])
          return
        }
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        setMembers(data)
      } catch {
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const mapped = useMemo(() => members.map((m, idx) => ({
    ...m,
    name: m.full_name,
    role: m.position,
    initials: getInitials(m.full_name || ''),
    color: COLORS[idx % COLORS.length],
    skills: deriveSkills(m),
  })), [members])

  const leadership = mapped.slice(0, 4)
  const team = mapped.slice(4)

  return (
    <PublicLayout>
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Jamoa</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Ajoyib <span className="gradient-text">odamlar</span> bilan ishlang
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              PRIMESTACK&apos;ning kuchi odamlar. Har bir a&apos;zo o&apos;z yo&apos;nalishida professional.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {!loading && members.length === 0 && (
        <section className="pb-24">
          <div className="container-custom">
            <AnimatedSection>
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Hozircha jamoa a&apos;zolari yo&apos;q</h2>
                <p className="text-gray-400">Admin paneldan `Jamoa` bo&apos;limida yangi a&apos;zo qo&apos;shing.</p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {leadership.length > 0 && (
        <section className="pb-16">
          <div className="container-custom">
            <AnimatedSection className="mb-10">
              <h2 className="font-display font-bold text-2xl text-white">Rahbariyat</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {leadership.map((m, i) => (
                <AnimatedSection key={m.id || m.name} delay={i * 0.08}>
                  <div className="p-6 rounded-2xl card-hover" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <div className="flex items-start gap-4">
                      <Avatar initials={m.initials} color={m.color} />
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-white text-lg">{m.name}</h3>
                        <div className="text-xs font-mono mb-2" style={{ color: m.color }}>{m.role}</div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-3">{m.bio || 'Bio qo‘shilmagan'}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.skills.map((s: string) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-full font-mono"
                              style={{ background: `${m.color}12`, color: m.color, border: `1px solid ${m.color}25` }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {m.linkedin_url && (
                          <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                            style={{ background: 'rgba(26,45,74,0.6)' }}>
                            <Linkedin size={14} />
                          </a>
                        )}
                        {m.github_url && (
                          <a href={m.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                            style={{ background: 'rgba(26,45,74,0.6)' }}>
                            <Github size={14} />
                          </a>
                        )}
                        {m.website_url && (
                          <a href={m.website_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                            style={{ background: 'rgba(26,45,74,0.6)' }}>
                            <Globe size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="pb-24">
          <div className="container-custom">
            <AnimatedSection className="mb-10">
              <h2 className="font-display font-bold text-2xl text-white">Jamoa a&apos;zolari</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {team.map((m, i) => (
                <AnimatedSection key={m.id || m.name} delay={i * 0.05}>
                  <div className="p-5 rounded-2xl card-hover text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <div className="flex justify-center mb-3">
                      <Avatar initials={m.initials} color={m.color} size="sm" />
                    </div>
                    <h4 className="font-display font-semibold text-white text-sm mb-0.5">{m.name}</h4>
                    <div className="text-xs text-gray-500 mb-3">{m.role}</div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {m.skills.map((s: string) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${m.color}10`, color: m.color, border: `1px solid ${m.color}20` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </PublicLayout>
  )
}
