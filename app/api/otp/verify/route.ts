import { NextRequest, NextResponse } from 'next/server'
import { query, formatDatetime } from '@/lib/db'
import {
  clearPendingLoginCookie,
  createLoginToken,
  getPendingLogin,
  OTP_EXPIRY_SECONDS,
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

    if (!pending.otpSentAt) {
      return NextResponse.json({
        success: false,
        message: 'No OTP found. Please request a new OTP.',
      })
    }

    const now = Math.floor(Date.now() / 1000)
    if (now - pending.otpSentAt > OTP_EXPIRY_SECONDS) {
      return NextResponse.json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
        expired: true,
      })
    }

    const { otp } = await req.json()
    if (!otp || !/^\d{4}$/.test(String(otp))) {
      return NextResponse.json({ success: false, message: 'Enter a valid 4-digit OTP' })
    }

    const userId = pending.adminId
    const rows = await query<{ otp: number | null }[]>(
      'SELECT otp FROM admin WHERE admin_id=?',
      [userId]
    )
    if (!rows.length) {
      return NextResponse.json({ success: false, message: 'User not found' })
    }

    if (String(rows[0].otp) !== String(otp)) {
      return NextResponse.json({
        success: false,
        message: 'Incorrect OTP. Please check and try again.',
      })
    }

    await query(
      'UPDATE admin SET otp=NULL, updated_by=?, updated_on=? WHERE admin_id=?',
      [userId, formatDatetime(), userId]
    )

    const loginToken = createLoginToken(pending.adminId, pending.email)
    await clearPendingLoginCookie()

    return NextResponse.json({
      success: true,
      message: 'Mobile verified successfully!',
      loginToken,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
