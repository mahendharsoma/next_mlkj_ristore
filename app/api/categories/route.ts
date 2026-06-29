import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT * FROM category ORDER BY category_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { category_name } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO category(category_name,created_by,created_on) VALUES(?,?,?)',
    [category_name, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { category_id: result.insertId } })
}
