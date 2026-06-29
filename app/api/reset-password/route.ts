import { NextRequest, NextResponse } from 'next/server'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, otp, password } = await req.json()
  const rows = await query<{ admin_id: number; otp: number }[]>(
    'SELECT admin_id, otp FROM admin WHERE email = ? AND status = "Active" LIMIT 1',
    [email]
  )
  if (!rows.length) return NextResponse.json({ success: false, message: 'Email not found' })
  if (rows[0].otp !== otp) return NextResponse.json({ success: false, message: 'Invalid OTP' })
  await query('UPDATE admin SET password = ?, otp = NULL, updated_on = ? WHERE email = ?', [password, formatDatetime(), email])
  return NextResponse.json({ success: true })
}
