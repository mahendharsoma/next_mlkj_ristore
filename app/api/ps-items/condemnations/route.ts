import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  if (!psId) return NextResponse.json({ success: false, message: 'ps_id required' }, { status: 400 })
  const rows = await query(
    `SELECT t.transaction_id,t.item_id,t.product_id,t.stock as quantity,t.added_on,t.created_on,p.product_name
     FROM items_transactions t
     LEFT JOIN products p ON p.product_id = t.product_id
     WHERE t.type_of_transaction='condemnation' AND t.ps_departemt_id=?
     ORDER BY t.transaction_id DESC`,
    [psId]
  )
  return NextResponse.json({ success: true, data: rows })
}
