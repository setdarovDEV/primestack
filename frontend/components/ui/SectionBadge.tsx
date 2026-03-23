interface Props {
  children: React.ReactNode
  className?: string
}

export default function SectionBadge({ children, className = '' }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 mb-4 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium"
        style={{
          background: 'rgba(0, 87, 255, 0.08)',
          border: '1px solid rgba(0, 87, 255, 0.2)',
          color: '#60A5FA',
        }}>
        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
        {children}
      </div>
    </div>
  )
}
