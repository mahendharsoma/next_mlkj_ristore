import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    'SELECT po.*,v.vendor_name FROM purchase_orders po LEFT JOIN vendors v ON v.vendor_id=po.vendor_id ORDER BY po.purchase_order_id DESC'
  )
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { number, vendor_id, status } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO purchase_orders(number,vendor_id,status,created_by,created_on) VALUES(?,?,?,?,?)',
    [number, vendor_id, status || 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { purchase_order_id: result.insertId } })
}
