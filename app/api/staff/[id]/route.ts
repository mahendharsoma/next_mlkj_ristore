import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { name, email, phone, role_ids } = await req.json()
  const now = formatDatetime()
  await query('UPDATE admin SET name=?,email=?,phone=?,updated_by=?,updated_on=? WHERE admin_id=?',
    [name, email, phone, userId, now, params.id])
  await query('DELETE FROM user_roles WHERE user_id=?', [params.id])
  if (role_ids?.length) {
    for (const rid of role_ids) {
      await query('INSERT INTO user_roles(user_id,role_id,created_by,created_on) VALUES(?,?,?,?)', [params.id, rid, userId, now])
    }
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM user_roles WHERE user_id=?', [params.id])
  await query('DELETE FROM admin WHERE admin_id=?', [params.id])
  return NextResponse.json({ success: true })
}
