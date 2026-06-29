import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { ps_id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    `SELECT ps.*,p.product_name,p.unit,d.name as ps_name
     FROM ps_items ps
     LEFT JOIN products p ON p.product_id=ps.product_id
     LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id
     WHERE ps.ps_department_id=? AND ps.condemned_stock>0
     ORDER BY ps.ps_item_id DESC`,
    [params.ps_id]
  )
  return NextResponse.json({ success: true, data: rows })
}
