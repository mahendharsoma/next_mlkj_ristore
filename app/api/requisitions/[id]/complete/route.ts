import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { rv_number, rv_date, received_quantity, remarks } = await req.json()

    if (!rv_number || !rv_date) {
      return NextResponse.json({ success: false, message: 'RV number and date are required' })
    }

    await query(
      'UPDATE requisitions SET status=?,rv_number=?,rv_date=?,received_quantity=?,remarks=?,completed_by=?,completed_date=?,updated_by=?,updated_on=? WHERE requisition_id=?',
      ['File Transfer to Superdent Store', rv_number, rv_date, received_quantity || null, remarks || null, userId, formatDatetime(), userId, formatDatetime(), params.id]
    )

    return NextResponse.json({ success: true, message: 'Requisition completed successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
