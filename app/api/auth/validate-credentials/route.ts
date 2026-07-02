import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createPendingLoginToken, setPendingLoginCookie } from '@/lib/pending-login'

interface AdminRow {
  admin_id: number
  email: string
  phone: string
  password: string
  status: string
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const rows = await query<AdminRow[]>(
      'SELECT admin_id, email, phone, password, status FROM admin WHERE email = ? LIMIT 1',
      [email]
    )
    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = rows[0]
    if (user.status !== 'Active') {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact an administrator.' },
        { status: 403 }
      )
    }
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = createPendingLoginToken({
      adminId: user.admin_id,
      email: user.email,
      registeredPhone: user.phone,
    })
    await setPendingLoginCookie(token)

    return NextResponse.json({
      success: true,
      message: 'Credentials verified. Please verify your mobile number.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
