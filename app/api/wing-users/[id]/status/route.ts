import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { status } = await req.json()
  await query('UPDATE wing_users SET status=?,updated_by=?,updated_on=? WHERE wing_user_id=?',
    [status, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}
