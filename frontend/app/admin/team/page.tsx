'use client'
import { useEffect, useState } from 'react'
import AdminTable, { Column, Field } from '@/components/admin/AdminTable'
import { adminApiFetch } from '@/lib/api'

const columns: Column[] = [
  { key: 'full_name', label: 'Ism-familiya', render: v => <span className="text-white font-medium">{v}</span> },
  { key: 'position', label: 'Lavozim' },
  { key: 'department', label: "Bo'lim" },
  { key: 'order', label: 'Tartib' },
  { key: 'visible', label: 'Ko\'rinadigan', render: v => <span className={v ? 'badge-success' : 'badge-danger'}>{v ? 'Ha' : "Yo'q"}</span> },
]

const fields: Field[] = [
  { key: 'full_name', label: 'Ism-familiya', type: 'text', required: true },
  { key: 'position', label: 'Lavozim', type: 'text', required: true, placeholder: 'Senior Engineer' },
  { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Qisqa bio...' },
  { key: 'department', label: "Bo'lim", type: 'select', options: [
    { value: 'Management', label: 'Management' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Design', label: 'Design' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'HR', label: 'HR' },
  ]},
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'text', placeholder: 'https://linkedin.com/in/...' },
  { key: 'github_url', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' },
  { key: 'order', label: 'Tartib raqami', type: 'number', placeholder: '1' },
  { key: 'visible', label: "Ko'rinadigan holat", type: 'toggle' },
]

export default function AdminTeamPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApiFetch('/api/v1/admin/team')
        const json = await res.json()
        setData(json.data || [])
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  const handleSave = async (formData: any, isEdit: boolean) => {
    const payload = { ...formData, order: Number(formData.order || 0), visible: !!formData.visible }
    if (isEdit) {
      await adminApiFetch(`/api/v1/admin/team/${formData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setData(prev => prev.map(item => item.id === formData.id ? { ...item, ...payload } : item))
      return
    }

    const res = await adminApiFetch('/api/v1/admin/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setData(prev => [...prev, { ...payload, ...json.data }])
  }

  const handleDelete = async (id: any) => {
    await adminApiFetch(`/api/v1/admin/team/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(item => item.id !== id))
  }

  return <AdminTable title="Jamoa a'zolari" data={data} columns={columns} fields={fields} onSave={handleSave} onDelete={handleDelete} searchKey="full_name" />
}
