import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  const from = searchParams.get('from_date')
  const to = searchParams.get('to_date')
  if (!psId || !from || !to) return NextResponse.json({ success: false, message: 'ps_id, from_date and to_date are required' }, { status: 400 })

  const rows = await query(
    `SELECT t.transaction_id,t.product_id,t.stock as quantity,t.added_on,
            COALESCE(p.product_name, p2.product_name) as product_name
     FROM items_transactions t
     LEFT JOIN products p ON p.product_id=t.product_id
     LEFT JOIN ps_items ps ON ps.ps_item_id=t.item_id
     LEFT JOIN products p2 ON p2.product_id=ps.product_id
     WHERE t.ps_departemt_id=? AND DATE(t.added_on) BETWEEN ? AND ?
     ORDER BY t.transaction_id DESC`,
    [psId, from, to]
  )
  return NextResponse.json({ success: true, data: rows })
}
