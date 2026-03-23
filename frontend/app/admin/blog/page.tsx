'use client'
import { useEffect, useState } from 'react'
import AdminTable, { Column, Field } from '@/components/admin/AdminTable'
import { adminApiFetch } from '@/lib/api'

const columns: Column[] = [
  { key: 'title', label: 'Sarlavha', render: v => <span className="text-white font-medium">{v}</span> },
  { key: 'category', label: 'Kategoriya' },
  { key: 'author', label: 'Muallif' },
  { key: 'status', label: 'Holat', render: v => (
    <span className={v === 'published' ? 'badge-success' : 'badge-warning'}>
      {v === 'published' ? 'Nashr etilgan' : 'Qoralama'}
    </span>
  )},
  { key: 'created_at', label: 'Sana', render: v => <span className="text-xs text-gray-500">{v}</span> },
]

const fields: Field[] = [
  { key: 'title', label: 'Sarlavha', type: 'text', required: true, placeholder: 'Maqola sarlavhasi' },
  { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'maqola-slug' },
  { key: 'excerpt', label: 'Qisqa mazmun', type: 'textarea', placeholder: 'Maqola haqida qisqacha...' },
  { key: 'category', label: 'Kategoriya', type: 'select', options: [
    { value: 'Web Dev', label: 'Web Dev' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Backend', label: 'Backend' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'UI/UX', label: 'UI/UX' },
    { value: 'Startup', label: 'Startup' },
  ]},
  { key: 'status', label: 'Holat', type: 'select', options: [
    { value: 'draft', label: 'Qoralama' },
    { value: 'published', label: 'Nashr etilgan' },
  ]},
]

export default function AdminBlogPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/posts')
        const json = await res.json()
        setData(json.data || [])
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  const handleSave = async (formData: any, isEdit: boolean) => {
    const payload = { ...formData, read_time: Number(formData.read_time || 5) }
    if (isEdit) {
      await adminApiFetch(`/api/v1/admin/posts/${formData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setData(prev => prev.map(item => item.id === formData.id ? { ...item, ...payload } : item))
    } else {
      const res = await adminApiFetch('/api/v1/admin/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setData(prev => [...prev, { ...payload, ...json.data, author: payload.author || 'Admin', created_at: new Date().toISOString().split('T')[0] }])
    }
  }

  const handleDelete = async (id: any) => {
    await adminApiFetch(`/api/v1/admin/posts/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }

  return (
    <AdminTable title="Blog maqolalar" data={data} columns={columns} fields={fields}
      onSave={handleSave} onDelete={handleDelete} searchKey="title" />
  )
}
