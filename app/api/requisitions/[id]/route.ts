import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product, quantity, reason_for_requisition } = await req.json()
  await query(
    'UPDATE requisitions SET product=?,quantity=?,reason_for_requisition=?,updated_by=?,updated_on=? WHERE requisition_id=? AND status="Requisition"',
    [product, quantity, reason_for_requisition, userId, formatDatetime(), params.id]
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM requisitions WHERE requisition_id=?', [params.id])
  return NextResponse.json({ success: true })
}
