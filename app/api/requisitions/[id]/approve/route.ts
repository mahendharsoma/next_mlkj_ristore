import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { po_number, po_date } = await req.json()

    if (!po_number || !po_date) {
      return NextResponse.json({ success: false, message: 'PO Number and PO Date are required' })
    }

    await query(
      'UPDATE requisitions SET status=?,po_number=?,po_date=?,updated_by=?,updated_on=? WHERE requisition_id=?',
      ['PO', po_number, po_date, userId, formatDatetime(), params.id]
    )

    return NextResponse.json({ success: true, message: 'Status updated to PO' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
