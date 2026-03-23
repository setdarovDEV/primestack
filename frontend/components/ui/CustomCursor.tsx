'use client'
import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return

    if (!window.matchMedia('(pointer: fine)').matches) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    root.classList.add('custom-cursor-enabled')

    const interactiveSelector = 'a, button, [role="button"], input, textarea, select, label, .btn-primary, .btn-secondary, .btn-outline'

    let targetX = window.innerWidth * 0.5
    let targetY = window.innerHeight * 0.5
    let dotX = targetX
    let dotY = targetY
    let visible = false
    let hovering = false
    let pressing = false
    let rafId = 0

    const isInteractive = (target: EventTarget | null) => {
      const el = target as Element | null
      return !!el?.closest(interactiveSelector)
    }

    const animate = (time: number) => {
      const dotEase = reduceMotion ? 1 : 0.34

      dotX += (targetX - dotX) * dotEase
      dotY += (targetY - dotY) * dotEase

      const pulse = 1 + Math.sin(time * 0.01) * 0.06
      const hoverScale = hovering ? 1.35 : 1
      const pressScale = pressing ? 0.8 : 1
      const scale = pulse * hoverScale * pressScale

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${scale})`
      dot.style.opacity = visible ? '1' : '0'
      dot.style.boxShadow = hovering
        ? '0 0 14px rgba(255,255,255,0.95), 0 0 36px rgba(255,255,255,0.6)'
        : '0 0 10px rgba(255,255,255,0.85), 0 0 22px rgba(255,255,255,0.45)'

      rafId = requestAnimationFrame(animate)
    }

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      if (!visible) visible = true
    }

    const onMouseOver = (e: MouseEvent) => {
      hovering = isInteractive(e.target)
    }

    const onMouseDown = () => {
      pressing = true
    }

    const onMouseUp = () => {
      pressing = false
    }

    const onMouseLeaveWindow = () => {
      visible = false
    }

    const onMouseEnterWindow = () => {
      visible = true
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseover', onMouseOver, { passive: true })
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseout', onMouseLeaveWindow)
    window.addEventListener('mouseover', onMouseEnterWindow)
    window.addEventListener('blur', onMouseLeaveWindow)

    rafId = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseout', onMouseLeaveWindow)
      window.removeEventListener('mouseover', onMouseEnterWindow)
      window.removeEventListener('blur', onMouseLeaveWindow)
      cancelAnimationFrame(rafId)
      root.classList.remove('custom-cursor-enabled')
    }
  }, [])

  return (
    <div
      ref={dotRef}
      className="fixed pointer-events-none z-[99999] w-2.5 h-2.5 rounded-full bg-white"
      style={{
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
        transition: 'opacity 0.2s',
        boxShadow: '0 0 10px rgba(255,255,255,0.85), 0 0 22px rgba(255,255,255,0.45)',
        willChange: 'transform, opacity, box-shadow',
      }}
    />
  )
}
