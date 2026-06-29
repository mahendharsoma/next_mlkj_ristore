import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { status: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    'SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status=? ORDER BY r.requisition_id DESC',
    [params.status]
  )
  return NextResponse.json({ success: true, data: rows })
}
