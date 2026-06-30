import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const rows = status
    ? await query(`SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status=? ORDER BY r.requisition_id DESC`, [status])
    : await query(`SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status != 'Rejected' ORDER BY r.requisition_id DESC`)
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id

  const {
    product,
    quantity,
    reason_for_requisition,
  } = await req.json()

  if (!product || !reason_for_requisition) {
    return NextResponse.json({
      success: false,
      message: 'Product and Reason are required.',
    })
  }

  const result = await query<{ insertId: number }>(
    `INSERT INTO requisitions
    (
      product,
      quantity,
      reason_for_requisition,
      status,
      created_by,
      created_on
    )
    VALUES
    (?, ?, ?, ?, ?, ?)`,
    [
      product,
      quantity || 0,
      reason_for_requisition,
      'Requisition',
      userId,
      formatDatetime(),
    ]
  )

  return NextResponse.json({
    success: true,
    message: 'Requisition created successfully.',
    data: {
      requisition_id: result.insertId,
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { requisition_id, product, quantity, reason_for_requisition } = await req.json()
  await query(
    'UPDATE requisitions SET product=?,quantity=?,reason_for_requisition=?,updated_by=?,updated_on=? WHERE requisition_id=?',
    [product, quantity, reason_for_requisition, userId, formatDatetime(), requisition_id]
  )
  return NextResponse.json({ success: true })
}
