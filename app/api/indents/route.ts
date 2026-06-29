import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    'SELECT i.*,p.name as wing_name FROM indents i LEFT JOIN ps_or_deparment p ON p.ps_department_id=i.wing_id ORDER BY i.indent_id DESC'
  )
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { wing_id, indent_name, indent_date, recived_by, general_number } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO indents(wing_id,indent_name,indent_date,recived_by,general_number,status,created_by,created_on) VALUES(?,?,?,?,?,?,?,?)',
    [wing_id, indent_name, indent_date, recived_by, general_number, 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { indent_id: result.insertId } })
}
