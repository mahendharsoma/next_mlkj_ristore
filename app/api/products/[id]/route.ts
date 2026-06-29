import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_name, category_id, stock_flag, status } = await req.json()
  await query('UPDATE products SET product_name=?,category_id=?,stock_flag=?,status=?,updated_by=?,updated_on=? WHERE product_id=?',
    [product_name, category_id, stock_flag || 0, status || 'Active', userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM products WHERE product_id=?', [params.id])
  return NextResponse.json({ success: true })
}
