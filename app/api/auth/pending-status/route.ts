import { NextResponse } from 'next/server'
import { getPendingLogin, getResendCooldownRemaining } from '@/lib/pending-login'

export async function GET() {
  try {
    const pending = await getPendingLogin()
    if (!pending) {
      return NextResponse.json({ success: false, authenticated: false })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      hasOtp: Boolean(pending.otpSentAt),
      mobile: pending.mobile,
      resendCooldown: getResendCooldownRemaining(pending.otpSentAt),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
