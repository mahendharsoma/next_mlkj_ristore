import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const rows = await query('SELECT * FROM settings')
    return NextResponse.json({ success: true, data: rows })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { settings } = await req.json()
    const entries = Array.isArray(settings) ? settings : Object.entries(settings).map(([key, value]) => ({ key, value }))
    for (const { key, value } of entries) {
      const existing = await query<{ setting_id: number }[]>('SELECT setting_id FROM settings WHERE setting_key=?', [key])
      if (existing.length) {
        await query('UPDATE settings SET setting_value=?,updated_by=?,updated_on=? WHERE setting_key=?',
          [value, userId, formatDatetime(), key])
      } else {
        await query('INSERT INTO settings(setting_key,setting_value,updated_by,updated_on) VALUES(?,?,?,?)',
          [key, value, userId, formatDatetime()])
      }
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to save settings' }, { status: 500 })
  }
}
