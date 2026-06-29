import { NextRequest, NextResponse } from 'next/server'
import { query, formatDatetime } from '@/lib/db'
import { sendOTPEmail } from '@/lib/mail'
import { generateOTP } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const rows = await query<{ admin_id: number }[]>(
    'SELECT admin_id FROM admin WHERE email = ? AND status = "Active" LIMIT 1',
    [email]
  )
  if (!rows.length) return NextResponse.json({ success: false, message: 'Email not found' })
  const otp = generateOTP()
  await query('UPDATE admin SET otp = ?, updated_on = ? WHERE email = ?', [otp, formatDatetime(), email])
  try {
    await sendOTPEmail(email, otp)
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to send OTP email' })
  }
  return NextResponse.json({ success: true })
}
