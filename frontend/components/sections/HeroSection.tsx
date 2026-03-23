'use client'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Zap, Shield, Globe } from 'lucide-react'

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: {
      x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string
    }[] = []

    const colors = ['#0057FF', '#00D4FF', '#7B2FFF', '#0057FF']
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            const alpha = Math.floor((1 - dist / 120) * 40).toString(16).padStart(2, '0')
            ctx.strokeStyle = '#0057FF' + alpha
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const stats = [
    { label: "Loyihalar", value: "120+" },
    { label: "Mijozlar", value: "85+" },
    { label: "Yillik tajriba", value: "8+" },
    { label: "Mutaxassislar", value: "40+" },
  ]

  const tags = [
    { icon: Zap, text: 'Lightning Fast' },
    { icon: Shield, text: 'Enterprise Secure' },
    { icon: Globe, text: 'Globally Scalable' },
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-mesh" style={{ zIndex: 1 }} />

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30" style={{ zIndex: 1 }} />

      {/* Radial glow center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,87,255,0.08) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 180, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #0057FF, transparent)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />
      <motion.div
        animate={{ y: [20, -20, 20], rotate: [360, 180, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #00D4FF, transparent)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="container-custom relative py-20" style={{ zIndex: 2 }}>
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium glass"
              style={{ border: '1px solid rgba(0,87,255,0.3)', color: '#60A5FA' }}>
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              Premium IT Solutions — Toshkent, Uzbekistan
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            <span className="text-white">Biznesingizni </span>
            <span className="gradient-text">raqamli kelajakka</span>
            <br />
            <span className="text-white">olib chiqamiz</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg text-gray-400 mb-8 max-w-2xl leading-relaxed"
          >
            PRIMESTACK — enterprise darajasidagi web, mobil va cloud yechimlari. Ideyadan produktgacha — bitta professional jamoa.
          </motion.p>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {tags.map(({ icon: Icon, text }) => (
              <div key={text} className="tag">
                <Icon size={12} />
                {text}
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/contact" className="btn-primary text-base px-8 py-3.5 group">
              Loyiha boshlash
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/projects" className="btn-secondary text-base px-8 py-3.5 group">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-1"
                style={{ background: 'rgba(0,87,255,0.2)' }}>
                <Play size={12} className="ml-0.5" />
              </span>
              Portfolio ko'rish
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 pt-8 border-t border-navy-border grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="font-display font-bold text-3xl md:text-4xl gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 2 }}
      >
        <span className="text-xs text-gray-500 font-mono">scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary-500 to-transparent" />
      </motion.div>
    </section>
  )
}
