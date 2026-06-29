import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    'SELECT transaction_id,item_id,product_id,stock,added_on,price,type_of_transaction,created_by,created_on FROM items_transactions WHERE item_id=? ORDER BY transaction_id DESC',
    [params.id]
  )
  return NextResponse.json({ success: true, data: rows })
}
