import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { vendor_name, vendor_phone, vendor_address } = await req.json()
  await query('UPDATE vendors SET vendor_name=?,vendor_phone=?,vendor_address=?,updated_by=?,updated_on=? WHERE vendor_id=?',
    [vendor_name, vendor_phone, vendor_address, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM vendors WHERE vendor_id=?', [params.id])
  return NextResponse.json({ success: true })
}
