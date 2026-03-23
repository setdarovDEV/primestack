'use client'
import { useEffect, useState } from 'react'
import AdminTable, { Column, Field } from '@/components/admin/AdminTable'
import { adminApiFetch } from '@/lib/api'

const columns: Column[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Nomi', render: (v) => <span className="text-white font-medium">{v}</span> },
  { key: 'slug', label: 'Slug', render: (v) => <span className="font-mono text-xs text-gray-400">{v}</span> },
  { key: 'order', label: 'Tartib' },
  { key: 'is_active', label: 'Holat', render: (v) => (
    <span className={v ? 'badge-success' : 'badge-danger'}>{v ? 'Faol' : 'Nofaol'}</span>
  )},
]

const fields: Field[] = [
  { key: 'title', label: 'Nomi', type: 'text', required: true, placeholder: 'Web ilovalar' },
  { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'web-apps' },
  { key: 'icon', label: 'Ikonka kodi', type: 'text', placeholder: 'code | cloud | seo | marketing | ai | chatbot | automation | analytics | shield' },
  { key: 'short_description', label: 'Qisqa tavsif', type: 'textarea', placeholder: 'Xizmat haqida qisqacha...' },
  { key: 'features_text', label: 'Imkoniyatlar (har qator alohida)', type: 'textarea', placeholder: 'SSR/ISR Next.js\nREST/GraphQL API\nSEO optimization' },
  { key: 'use_cases_text', label: "Qo'llanilishi (har qator alohida)", type: 'textarea', placeholder: "Korporativ saytlar\nE-commerce platformalar\nSaaS dashboardlar" },
  { key: 'order', label: 'Tartib raqami', type: 'number', placeholder: '1' },
  { key: 'is_active', label: 'Faol holat', type: 'toggle' },
]

function parseContent(fullContent?: string) {
  if (!fullContent) return { features: [] as string[], useCases: [] as string[] }
  try {
    const parsed = JSON.parse(fullContent)
    return {
      features: Array.isArray(parsed.features) ? parsed.features : [],
      useCases: Array.isArray(parsed.use_cases) ? parsed.use_cases : [],
    }
  } catch {
    return { features: [], useCases: [] }
  }
}

function withTemplateFields(item: any) {
  const content = parseContent(item.full_content)
  return {
    ...item,
    features_text: content.features.join('\n'),
    use_cases_text: content.useCases.join('\n'),
  }
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminServicesPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/services')
        const json = await res.json()
        setData((json.data || []).map(withTemplateFields))
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  const handleSave = async (formData: any, isEdit: boolean) => {
    const payload = {
      ...formData,
      slug: String(formData.slug || '').trim() || slugify(String(formData.title || '')),
      order: Number(formData.order || 0),
      is_active: !!formData.is_active,
      full_content: JSON.stringify({
        features: String(formData.features_text || '')
          .split('\n')
          .map((v: string) => v.trim())
          .filter(Boolean),
        use_cases: String(formData.use_cases_text || '')
          .split('\n')
          .map((v: string) => v.trim())
          .filter(Boolean),
      }),
    }
    if (isEdit) {
      await adminApiFetch(`/api/v1/admin/services/${formData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setData(prev => prev.map(item => item.id === formData.id ? withTemplateFields({ ...item, ...payload }) : item))
    } else {
      const res = await adminApiFetch('/api/v1/admin/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setData(prev => [...prev, withTemplateFields(json.data)])
    }
  }

  const handleDelete = async (id: any) => {
    await adminApiFetch(`/api/v1/admin/services/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }

  return (
    <AdminTable
      title="Xizmatlar"
      data={data}
      columns={columns}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchKey="title"
    />
  )
}
