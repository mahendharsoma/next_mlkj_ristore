import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { otp } = await req.json()
    if (!otp) return NextResponse.json({ success: false, message: 'Enter OTP' })
    const rows = await query<{ otp: string | null }[]>('SELECT otp FROM admin WHERE admin_id=?', [userId])
    if (!rows.length) return NextResponse.json({ success: false, message: 'User not found' })
    if (String(rows[0].otp) !== String(otp)) {
      return NextResponse.json({ success: false, message: 'Incorrect OTP, please check and try again' })
    }
    await query('UPDATE admin SET otp=NULL,updated_by=?,updated_on=? WHERE admin_id=?',
      [userId, formatDatetime(), userId])
    return NextResponse.json({ success: true, message: 'Mobile verified successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
