'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Settings {
  site_name: string
  site_email: string
  site_phone: string
  site_address: string
  low_stock_threshold: string
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    site_name: '',
    site_email: '',
    site_phone: '',
    site_address: '',
    low_stock_threshold: '10',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then(d => {
        if (d.success && d.data) {
          const s: Record<string, string> = {}
          d.data.forEach((row: { setting_key: string; setting_value: string }) => {
            s[row.setting_key] = row.setting_value
          })
          setForm(prev => ({ ...prev, ...s }))
        } else if (d.message) {
          toast.error(d.message)
        }
      })
      .catch(err => { toast.error(err.message || 'Failed to load settings') })
  }, [])

  const save = async () => {
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }))
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: entries })
      })
      if (!res.ok) throw new Error(await res.text())
      const d = await res.json()
      if (d.success) { toast.success('Settings saved') } else { toast.error(d.message || 'Error saving settings') }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    }
  }

  const fields: { key: keyof Settings; label: string; type?: string }[] = [
    { key: 'site_name', label: 'Site Name' },
    { key: 'site_email', label: 'Site Email', type: 'email' },
    { key: 'site_phone', label: 'Site Phone' },
    { key: 'site_address', label: 'Site Address' },
    { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Application Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-5">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <button onClick={save}
          className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  )
}
