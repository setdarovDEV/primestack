'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, Image, File, Search, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_MEDIA = [
  { id: 1, file_name: 'hero-bg.jpg', mime_type: 'image/jpeg', size: 245000, url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', created_at: '2026-03-15' },
  { id: 2, file_name: 'team-photo.png', mime_type: 'image/png', size: 189000, url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', created_at: '2026-03-14' },
  { id: 3, file_name: 'project-cover.jpg', mime_type: 'image/jpeg', size: 312000, url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', created_at: '2026-03-12' },
  { id: 4, file_name: 'logo-dark.svg', mime_type: 'image/svg+xml', size: 5200, url: '', created_at: '2026-03-10' },
  { id: 5, file_name: 'presentation.pdf', mime_type: 'application/pdf', size: 1240000, url: '', created_at: '2026-03-08' },
  { id: 6, file_name: 'office-photo.jpg', mime_type: 'image/jpeg', size: 412000, url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', created_at: '2026-03-05' },
]

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState(DEMO_MEDIA)
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = files.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()))

  const handleUpload = (fileList: FileList | null) => {
    if (!fileList) return
    Array.from(fileList).forEach(file => {
      const newFile = {
        id: Date.now() + Math.random(),
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        created_at: new Date().toISOString().split('T')[0],
      }
      setFiles(prev => [newFile, ...prev])
    })
    toast.success(`${fileList.length} ta fayl yuklandi`)
  }

  const handleDelete = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    toast.success("O'chirildi")
  }

  const copyURL = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL nusxa olindi')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Media kutubxona</h1>
          <p className="text-gray-400 text-sm mt-0.5">{files.length} ta fayl</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="form-input pl-12 py-2 text-sm w-44" />
          </div>
          <button onClick={() => inputRef.current?.click()} className="btn-primary text-sm py-2">
            <Upload size={14} /> Yuklash
          </button>
          <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.svg" className="hidden"
            onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
        className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragging ? 'border-primary-400 bg-primary-400/5' : 'border-navy-border'}`}
      >
        <Upload size={28} className={`mx-auto mb-2 ${dragging ? 'text-primary-400' : 'text-gray-600'}`} />
        <p className="text-sm text-gray-500">
          Fayllarni bu yerga tashlang yoki{' '}
          <button onClick={() => inputRef.current?.click()} className="text-primary-400 hover:underline">tanlang</button>
        </p>
        <p className="text-xs text-gray-600 mt-1">PNG, JPG, SVG, PDF — max 10MB</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((file, i) => {
          const isImage = file.mime_type.startsWith('image/')
          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group rounded-xl overflow-hidden relative"
              style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}
            >
              {/* Thumbnail */}
              <div className="h-28 flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(8,14,31,0.8)' }}>
                {isImage && file.url ? (
                  <img src={file.url} alt={file.file_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {isImage ? <Image size={24} className="text-gray-600" /> : <File size={24} className="text-gray-600" />}
                    <span className="text-xs text-gray-600 uppercase">{file.mime_type.split('/')[1]}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-gray-400 truncate">{file.file_name}</p>
                <p className="text-xs text-gray-600">{formatSize(file.size)}</p>
              </div>

              {/* Actions on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {file.url && (
                  <button onClick={() => copyURL(file.url)} className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                    <Copy size={12} className="text-white" />
                  </button>
                )}
                <button onClick={() => handleDelete(file.id)} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
