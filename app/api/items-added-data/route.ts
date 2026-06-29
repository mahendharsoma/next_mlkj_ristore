import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const poId = searchParams.get('purchase_order_id')
  const from = searchParams.get('from_date')
  const to = searchParams.get('to_date')
  if (!poId || !from || !to) return NextResponse.json({ success: false, message: 'purchase_order_id, from_date and to_date are required' }, { status: 400 })

  const rows = await query(
    `SELECT t.transaction_id,t.item_id,t.product_id,t.stock as quantity,t.price,t.added_on,
            p.product_name,c.category_name,poi.purchase_order_id
     FROM items_transactions t
     LEFT JOIN purchase_order_items poi ON poi.item_id = t.item_id
     LEFT JOIN products p ON p.product_id = t.product_id
     LEFT JOIN category c ON c.category_id = p.category_id
     WHERE t.type_of_transaction='added' AND poi.purchase_order_id=? AND DATE(t.added_on) BETWEEN ? AND ?
     ORDER BY t.transaction_id DESC`,
    [poId, from, to]
  )
  return NextResponse.json({ success: true, data: rows })
}
