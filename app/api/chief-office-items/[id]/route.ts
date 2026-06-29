import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { category_id, product_id, order_stock } = await req.json()
  await query('UPDATE purchase_order_items SET category_id=?,product_id=?,order_stock=?,updated_by=?,updated_on=? WHERE item_id=?',
    [category_id, product_id, order_stock, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM purchase_order_items WHERE item_id=?', [params.id])
  return NextResponse.json({ success: true })
}
