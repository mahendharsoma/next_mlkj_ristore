'use client'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { User, Lock, Camera } from 'lucide-react'

interface Profile { admin_id: number; name: string; email: string; phone: string; profile_image?: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [tab, setTab] = useState<'info' | 'password'>('info')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = () => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.success) {
        setProfile(d.data)
        setForm({ name: d.data.name, email: d.data.email, phone: d.data.phone || '' })
        setImagePreview(d.data.profile_image ? `/uploads/profile/${d.data.profile_image}` : null)
      }
    })
  }

  useEffect(() => { loadProfile() }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/profile/image', { method: 'POST', body: fd })
    const d = await res.json()
    if (d.success) { toast.success('Profile photo updated'); setImagePreview(d.url) }
    else toast.error(d.message || 'Upload failed')
  }

  const saveInfo = async () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    fd.append('phone', form.phone)
    const res = await fetch('/api/profile', { method: 'PUT', body: fd })
    const d = await res.json()
    if (d.success) { toast.success('Profile updated'); setImageFile(null); loadProfile() }
    else toast.error(d.message || 'Error')
  }

  const savePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) return toast.error('Fill all fields')
    if (pwForm.new_password !== pwForm.confirm_password) return toast.error('Passwords do not match')
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password', current_password: pwForm.current_password, new_password: pwForm.new_password })
    })
    const d = await res.json()
    if (d.success) { toast.success('Password changed'); setPwForm({ current_password: '', new_password: '', confirm_password: '' }) }
    else toast.error(d.message || 'Error')
  }

  const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center gap-5">
        <div className="relative">
          {imagePreview
            ? <img src={imagePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-blue-200" />
            : <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-2 border-blue-200">{initials}</div>
          }
          <button onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 shadow hover:bg-blue-700">
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">{profile?.name || '—'}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <p className="text-sm text-gray-400">{profile?.phone || 'No phone'}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'info' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <User className="w-4 h-4" /> Edit Profile
        </button>
        <button onClick={() => setTab('password')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'password' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <Lock className="w-4 h-4" /> Change Password
        </button>
      </div>

      {tab === 'info' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={saveInfo} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Current Password</label>
              <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Confirm New Password</label>
              <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={savePassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
