import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    'SELECT poi.*,p.product_name,c.category_name FROM purchase_order_items poi LEFT JOIN products p ON p.product_id=poi.product_id LEFT JOIN category c ON c.category_id=poi.category_id WHERE poi.purchase_order_id IS NULL ORDER BY poi.item_id DESC'
  )
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { category_id, product_id, order_stock } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO purchase_order_items(purchase_order_id,category_id,product_id,order_stock,recived_stock,balance_stock,created_by,created_on) VALUES(NULL,?,?,?,0,?,?,?)',
    [category_id, product_id, order_stock, order_stock, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { item_id: result.insertId } })
}
