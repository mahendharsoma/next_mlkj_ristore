import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { status, vendor_id, amount, po_number, po_date, rv_number, rv_date } = await req.json()
  await query(
    'UPDATE requisitions SET status=?,vendor_id=?,amount=?,po_number=?,po_date=?,rv_number=?,rv_date=?,updated_by=?,updated_on=? WHERE requisition_id=?',
    [status, vendor_id || null, amount || null, po_number || null, po_date || null, rv_number || null, rv_date || null, userId, formatDatetime(), params.id]
  )
  return NextResponse.json({ success: true })
}
