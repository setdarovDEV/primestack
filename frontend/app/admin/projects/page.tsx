'use client'
import { useEffect, useState } from 'react'
import AdminTable, { Column, Field } from '@/components/admin/AdminTable'
import { adminApiFetch } from '@/lib/api'

const projectColumns: Column[] = [
  { key: 'title', label: 'Loyiha nomi', render: v => <span className="text-white font-medium">{v}</span> },
  { key: 'client', label: 'Mijoz' },
  { key: 'category', label: 'Kategoriya' },
  { key: 'year', label: 'Yil' },
  { key: 'status', label: 'Holat', render: v => (
    <span className={v === 'published' ? 'badge-success' : 'badge-warning'}>{v === 'published' ? 'Nashr' : 'Qoralama'}</span>
  )},
]

const projectFields: Field[] = [
  { key: 'title', label: 'Loyiha nomi', type: 'text', required: true },
  { key: 'client', label: 'Mijoz nomi', type: 'text', required: true },
  { key: 'summary', label: 'Qisqa tavsif', type: 'textarea' },
  { key: 'category', label: 'Kategoriya', type: 'select', options: [
    { value: 'Fintech', label: 'Fintech' },
    { value: 'E-commerce', label: 'E-commerce' },
    { value: 'SaaS', label: 'SaaS' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Cloud', label: 'Cloud' },
  ]},
  { key: 'result_kpi', label: 'Natija / KPI', type: 'text', placeholder: '2M+ foydalanuvchi' },
  { key: 'tech_stack', label: 'Texnologiyalar', type: 'text', placeholder: 'Next.js, Go, PostgreSQL' },
  { key: 'year', label: 'Yil', type: 'text', placeholder: '2024' },
  { key: 'status', label: 'Holat', type: 'select', options: [
    { value: 'draft', label: 'Qoralama' },
    { value: 'published', label: 'Nashr' },
  ]},
]

export default function AdminProjectsPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/projects')
        const json = await res.json()
        setData(json.data || [])
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  const handleSave = async (formData: any, isEdit: boolean) => {
    const payload = { ...formData, slug: formData.slug || '' }
    if (isEdit) {
      await adminApiFetch(`/api/v1/admin/projects/${formData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setData(prev => prev.map(item => item.id === formData.id ? { ...item, ...payload } : item))
      return
    }

    const res = await adminApiFetch('/api/v1/admin/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setData(prev => [...prev, { ...payload, ...json.data }])
  }

  const handleDelete = async (id: any) => {
    await adminApiFetch(`/api/v1/admin/projects/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }

  return <AdminTable title="Loyihalar (Portfolio)" data={data} columns={projectColumns} fields={projectFields} onSave={handleSave} onDelete={handleDelete} searchKey="title" />
}
