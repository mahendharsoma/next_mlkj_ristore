import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  const rows = psId
    ? await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id WHERE ps.ps_department_id=? AND ps.condemned_stock>0', [psId])
    : await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id WHERE ps.condemned_stock>0')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { ps_item_id, condemned_qty } = await req.json()
  await query(
    'UPDATE ps_items SET available_stock=available_stock-?,condemned_stock=condemned_stock+?,updated_by=?,updated_on=? WHERE ps_item_id=?',
    [condemned_qty, condemned_qty, userId, formatDatetime(), ps_item_id]
  )
  return NextResponse.json({ success: true })
}
