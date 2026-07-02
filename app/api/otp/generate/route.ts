import { NextRequest, NextResponse } from 'next/server'
import { query, formatDatetime } from '@/lib/db'
import {
  createPendingLoginToken,
  getPendingLogin,
  getResendCooldownRemaining,
  setPendingLoginCookie,
} from '@/lib/pending-login'

export async function POST(req: NextRequest) {
  try {
    const pending = await getPendingLogin()
    if (!pending) {
      return NextResponse.json(
        { success: false, message: 'Login session expired. Please sign in again.' },
        { status: 401 }
      )
    }

    const { mobile } = await req.json()
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Enter a valid 10-digit mobile number' })
    }

    if (pending.registeredPhone !== mobile) {
      return NextResponse.json({
        success: false,
        message: 'Phone number does not match your registered number',
      })
    }

    const cooldown = getResendCooldownRemaining(pending.otpSentAt)
    if (cooldown > 0) {
      return NextResponse.json({
        success: false,
        message: `Please wait ${cooldown} seconds before requesting a new OTP`,
        resendCooldown: cooldown,
      })
    }

    const otp = 1234
    const now = Math.floor(Date.now() / 1000)
    const userId = pending.adminId

    await query(
      'UPDATE admin SET otp=?, updated_by=?, updated_on=? WHERE admin_id=?',
      [otp, userId, formatDatetime(), userId]
    )

    const updatedToken = createPendingLoginToken({
      adminId: pending.adminId,
      email: pending.email,
      registeredPhone: pending.registeredPhone,
      mobile,
      otpSentAt: now,
    })
    await setPendingLoginCookie(updatedToken)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your registered mobile number',
      resendCooldown: 60,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
