'use client'
import { useEffect, useState } from 'react'
import AdminTable, { Column, Field } from '@/components/admin/AdminTable'
import { adminApiFetch } from '@/lib/api'

const columns: Column[] = [
  { key: 'title', label: 'Lavozim', render: v => <span className="text-white font-medium">{v}</span> },
  { key: 'department', label: 'Bo\'lim' },
  { key: 'level', label: 'Daraja' },
  { key: 'location', label: 'Joylashuv' },
  { key: 'status', label: 'Holat', render: v => (
    <span className={v === 'open' ? 'badge-success' : 'badge-danger'}>{v === 'open' ? 'Ochiq' : 'Yopiq'}</span>
  )},
]

const fields: Field[] = [
  { key: 'title', label: 'Lavozim nomi', type: 'text', required: true, placeholder: 'Senior Go Engineer' },
  { key: 'department', label: "Bo'lim", type: 'select', options: [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Design', label: 'Design' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Infra', label: 'Infrastructure' },
    { value: 'Management', label: 'Management' },
  ]},
  { key: 'level', label: 'Daraja', type: 'select', options: [
    { value: 'Junior', label: 'Junior' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead' },
  ]},
  { key: 'location', label: 'Joylashuv', type: 'text', placeholder: 'Toshkent / Remote' },
  { key: 'description', label: 'Tavsif', type: 'textarea', placeholder: 'Vazifa va talablar...' },
  { key: 'apply_url', label: 'Ariza URL', type: 'text', placeholder: 'https://...' },
  { key: 'status', label: 'Holat', type: 'select', options: [
    { value: 'open', label: 'Ochiq' },
    { value: 'closed', label: 'Yopiq' },
  ]},
]

export default function AdminVacanciesPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/vacancies')
        const json = await res.json()
        setData(json.data || [])
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  const handleSave = async (formData: any, isEdit: boolean) => {
    const payload = { ...formData }
    if (isEdit) {
      await adminApiFetch(`/api/v1/admin/vacancies/${formData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setData(prev => prev.map(item => item.id === formData.id ? { ...item, ...payload } : item))
    } else {
      const res = await adminApiFetch('/api/v1/admin/vacancies', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setData(prev => [...prev, { ...payload, ...json.data }])
    }
  }

  const handleDelete = async (id: any) => {
    await adminApiFetch(`/api/v1/admin/vacancies/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }

  return (
    <AdminTable title="Vakansiyalar" data={data} columns={columns} fields={fields}
      onSave={handleSave} onDelete={handleDelete} searchKey="title" />
  )
}
