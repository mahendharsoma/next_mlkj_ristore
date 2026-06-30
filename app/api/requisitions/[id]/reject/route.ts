import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { rejection_reason } = await req.json()

    if (!rejection_reason) {
      return NextResponse.json({ success: false, message: 'Rejection reason is required' })
    }

    await query(
      'UPDATE requisitions SET status=?,rejection_reason=?,updated_by=?,updated_on=? WHERE requisition_id=?',
      ['Rejected', rejection_reason, userId, formatDatetime(), params.id]
    )

    return NextResponse.json({ success: true, message: 'Requisition rejected successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
