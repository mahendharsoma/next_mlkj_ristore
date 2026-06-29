import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { wing_id, indent_name, indent_date, recived_by, general_number } = await req.json()
  await query(
    'UPDATE indents SET wing_id=?,indent_name=?,indent_date=?,recived_by=?,general_number=?,updated_by=?,updated_on=? WHERE indent_id=?',
    [wing_id, indent_name, indent_date, recived_by, general_number, userId, formatDatetime(), params.id]
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM indents WHERE indent_id=?', [params.id])
  return NextResponse.json({ success: true })
}
