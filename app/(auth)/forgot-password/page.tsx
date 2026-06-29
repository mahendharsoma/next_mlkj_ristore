'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Package, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      toast.success('OTP sent to your email')
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } else {
      toast.error(data.message || 'Email not found')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4">
            <Package className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive an OTP</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => router.push('/login')} className="text-sm text-gray-500 hover:underline flex items-center gap-1 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
