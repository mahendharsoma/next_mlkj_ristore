import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { number, vendor_id, status } = await req.json()
  await query('UPDATE purchase_orders SET number=?,vendor_id=?,status=?,updated_by=?,updated_on=? WHERE purchase_order_id=?',
    [number, vendor_id, status || 'Active', userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM purchase_orders WHERE purchase_order_id=?', [params.id])
  return NextResponse.json({ success: true })
}
