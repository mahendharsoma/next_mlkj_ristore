import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')

  let sql = `
    SELECT
      t.*,
      p.product_name,
      d.name AS ps_name
    FROM items_transactions t
    LEFT JOIN products p
      ON p.product_id = t.product_id
    LEFT JOIN ps_or_deparment d
      ON d.ps_department_id = t.ps_departemt_id
    WHERE t.type_of_transaction = 'transfering'
  `

  const params: any[] = []

  if (productId) {
    sql += ` AND t.product_id = ?`
    params.push(productId)
  }

  sql += ` ORDER BY t.transaction_id DESC LIMIT 200`

  const rows = await query(sql, params)

  return NextResponse.json({
    success: true,
    data: rows,
  })
}