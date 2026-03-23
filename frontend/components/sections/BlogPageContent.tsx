'use client'

import { useEffect, useState } from 'react'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

const GRADIENTS = [
  'from-blue-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-orange-600 to-red-500',
  'from-pink-600 to-rose-500',
  'from-violet-600 to-indigo-500',
]

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BlogPageContent() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/blog')
        if (!res.ok) {
          setPosts([])
          return
        }
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        const mapped = data.map((item: any, idx: number) => ({
          slug: item.slug,
          title: item.title,
          excerpt: item.excerpt || '',
          category: item.category || 'Blog',
          readTime: `${item.read_time || 5} min`,
          date: formatDate(item.published_at || item.created_at),
          gradient: GRADIENTS[idx % GRADIENTS.length],
        }))
        setPosts(mapped)
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <PublicLayout>
      <section className="relative pt-20 pb-16">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-2xl">
            <SectionBadge>Blog</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-5">
              Texnologiya haqida <span className="gradient-text">chuqur maqolalar</span>
            </h1>
            <p className="text-gray-400 text-lg">
              PRIMESTACK jamoasining tajribasi va bilimlarini baham ko&apos;ring.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom">
          {!loading && posts.length === 0 && (
            <AnimatedSection>
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Hozircha blog maqolalar yo&apos;q</h2>
                <p className="text-gray-400">Admin panelda `published` holatda maqola qo&apos;shilgach shu yerda ko&apos;rinadi.</p>
              </div>
            </AnimatedSection>
          )}

          {featured && (
            <AnimatedSection className="mb-8">
              <Link href={`/blog/${featured.slug}`} className="block">
                <div className="rounded-2xl overflow-hidden card-hover group" style={{ border: '1px solid rgba(26,45,74,0.8)' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className={`h-56 lg:h-auto bg-gradient-to-br ${featured.gradient} relative`}>
                      <div className="absolute inset-0 grid-bg opacity-20" />
                      <div className="absolute top-4 left-4">
                        <span className="tag">Featured</span>
                      </div>
                    </div>
                    <div className="p-8" style={{ background: 'rgba(15,30,53,0.9)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="tag">{featured.category}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} /> {featured.readTime}</div>
                      </div>
                      <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3 group-hover:text-primary-300 transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-gray-400 mb-5 leading-relaxed">{featured.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{featured.date}</span>
                        <span className="text-sm text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                          O&apos;qish <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((post, i) => (
              <AnimatedSection key={post.slug || i} delay={i * 0.07}>
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className="rounded-2xl overflow-hidden card-hover h-full flex flex-col group"
                    style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <div className={`h-36 bg-gradient-to-br ${post.gradient} relative flex-shrink-0`}>
                      <div className="absolute inset-0 grid-bg opacity-20" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="tag">{post.category}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} /> {post.readTime}</div>
                      </div>
                      <h3 className="font-display font-semibold text-white mb-2 flex-1 group-hover:text-primary-300 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                      <span className="text-xs text-gray-500">{post.date}</span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  )
}

