import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { status, vendor_id, amount, po_number, po_date, rv_number, rv_date } = await req.json()

    // Build update query dynamically based on provided fields (only existing columns)
    const updates: string[] = []
    const values: any[] = []

    updates.push('status=?')
    values.push(status)

    if (vendor_id) { updates.push('vendor_id=?'); values.push(vendor_id) }
    if (amount) { updates.push('amount=?'); values.push(amount) }
    if (po_number) { updates.push('po_number=?'); values.push(po_number) }
    if (po_date) { updates.push('po_date=?'); values.push(po_date) }
    if (rv_number) { updates.push('rv_number=?'); values.push(rv_number) }
    if (rv_date) { updates.push('rv_date=?'); values.push(rv_date) }

    updates.push('updated_by=?'); values.push(userId)
    updates.push('updated_on=?'); values.push(formatDatetime())
    values.push(params.id)

    await query(
      `UPDATE requisitions SET ${updates.join(',')} WHERE requisition_id=?`,
      values
    )

    return NextResponse.json({ success: true, message: 'Status updated successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
