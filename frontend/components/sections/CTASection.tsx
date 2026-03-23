import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function CTASection() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
            style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(0,87,255,0.2)' }}>
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,87,255,0.15), transparent 70%)' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
                style={{ background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.25)', color: '#60A5FA' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                Bepul konsultatsiya
              </div>

              <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
                Loyihangizni <span className="gradient-text">bugun boshlang</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8 text-lg">
                Bizning mutaxassislar bilan bepul maslahat oling. Ideyangizni professional produktga aylantiramiz.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/contact" className="btn-primary text-base px-8 py-3.5 group">
                  Loyiha boshlash
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="https://t.me/primestackuz_bot" target="_blank" rel="noopener noreferrer" className="btn-secondary text-base px-8 py-3.5">
                  <MessageSquare size={18} />
                  Telegram orqali
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
