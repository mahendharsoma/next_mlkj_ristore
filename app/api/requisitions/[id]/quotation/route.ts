import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { vendor_id, amount } = await req.json()

    if (!vendor_id || !amount) {
      return NextResponse.json({ success: false, message: 'Vendor and amount are required' })
    }

    await query(
      'UPDATE requisitions SET status=?,vendor_id=?,amount=?,updated_by=?,updated_on=? WHERE requisition_id=?',
      ['Committee', vendor_id, amount, userId, formatDatetime(), params.id]
    )

    return NextResponse.json({ success: true, message: 'Status updated to Committee' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
