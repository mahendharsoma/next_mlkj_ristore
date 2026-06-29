'use client'
import { useState, Suspense } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: parseInt(otp), password }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      toast.success('Password reset successfully')
      router.push('/login')
    } else {
      toast.error(data.message || 'Invalid OTP')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4"><Package className="text-white w-8 h-8" /></div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter OTP and new password for <strong>{email}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
            <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 4-digit OTP" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">Loading...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
