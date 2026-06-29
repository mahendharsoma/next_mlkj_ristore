import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  const catId = searchParams.get('category_id')
  let sql = 'SELECT ps.*,p.product_name,p.category_id,c.category_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN category c ON c.category_id=p.category_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id'
  const params: (string | number)[] = []
  const where: string[] = []
  if (psId) { where.push('ps.ps_department_id=?'); params.push(psId) }
  if (catId) { where.push('p.category_id=?'); params.push(catId) }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY ps.ps_item_id DESC'
  const rows = await query(sql, params)
  return NextResponse.json({ success: true, data: rows })
}
