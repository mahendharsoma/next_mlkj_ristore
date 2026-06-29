import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const wingId = searchParams.get('wing_id')
  const rows = wingId
    ? await query('SELECT wu.*,a.name as user_name,p.name as wing_name FROM wing_users wu LEFT JOIN admin a ON a.admin_id=wu.user_id LEFT JOIN ps_or_deparment p ON p.ps_department_id=wu.ps_department_id WHERE wu.ps_department_id=? ORDER BY wu.wing_user_id DESC', [wingId])
    : await query('SELECT wu.*,a.name as user_name,p.name as wing_name FROM wing_users wu LEFT JOIN admin a ON a.admin_id=wu.user_id LEFT JOIN ps_or_deparment p ON p.ps_department_id=wu.ps_department_id ORDER BY wu.wing_user_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { user_id, ps_department_id } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO wing_users(user_id,ps_department_id,status,created_by,created_on) VALUES(?,?,?,?,?)',
    [user_id, ps_department_id, 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { wing_user_id: result.insertId } })
}
