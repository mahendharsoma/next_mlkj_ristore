'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package, Phone, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function OtpVerificationPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const maskedMobile = mobile ? mobile.slice(0, 2) + '******' + mobile.slice(-2) : ''

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(mobile)) return toast.error('Enter a valid 10-digit mobile number')
    setLoading(true)
    const res = await fetch('/api/otp/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    })
    const d = await res.json()
    setLoading(false)
    if (d.success) { toast.success(d.message); setStep('otp') }
    else toast.error(d.message || 'Error sending OTP')
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 4) return toast.error('Enter 4-digit OTP')
    setLoading(true)
    const res = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    })
    const d = await res.json()
    setLoading(false)
    if (d.success) { toast.success('Mobile verified successfully!'); router.push('/dashboard') }
    else toast.error(d.message || 'Invalid OTP')
  }

  const resendOtp = async () => {
    setOtp('')
    setLoading(true)
    const res = await fetch('/api/otp/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    })
    const d = await res.json()
    setLoading(false)
    if (d.success) toast.success('OTP resent successfully')
    else toast.error(d.message || 'Failed to resend OTP')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex flex-col items-center">
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <Package className="text-white w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Mobile Verification</h1>
          <p className="text-blue-100 text-xs mt-1">Stock Management System</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-8 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'phone' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
              {step === 'otp' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-xs font-medium ${step === 'phone' ? 'text-blue-600' : 'text-green-600'}`}>Enter Mobile</span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step === 'otp' ? 'bg-green-400' : 'bg-gray-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
            <span className={`text-xs font-medium ${step === 'otp' ? 'text-blue-600' : 'text-gray-400'}`}>Verify OTP</span>
          </div>
        </div>

        <div className="px-8 py-7">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-500">Enter your registered mobile number to receive a 4-digit OTP</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400 border-r border-gray-300 pr-2">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-300 rounded-xl pl-16 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || mobile.length !== 10}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Sending OTP...
                  </span>
                ) : 'Send OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-500">OTP sent to</p>
                <p className="text-base font-semibold text-gray-800 mt-0.5">+91 {maskedMobile}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter 4-digit OTP</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 transition"
                    placeholder="——"
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length !== 4}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Verifying...
                  </span>
                ) : 'Verify OTP ✓'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setStep('phone'); setOtp('') }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change number
                </button>
                <button type="button" onClick={resendOtp} disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50 transition">
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
