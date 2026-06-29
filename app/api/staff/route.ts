import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'
import { generateRandomPassword } from '@/lib/helpers'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(
    `SELECT a.admin_id, a.name, a.email, a.phone, a.status, a.created_on,
      GROUP_CONCAT(r.role_name SEPARATOR ', ') as roles,
      GROUP_CONCAT(r.role_id SEPARATOR ',') as role_ids
     FROM admin a
     LEFT JOIN user_roles ur ON ur.user_id = a.admin_id
     LEFT JOIN roles r ON r.role_id = ur.role_id
     GROUP BY a.admin_id ORDER BY a.admin_id DESC`
  )
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { name, email, phone, role_ids } = await req.json()
  const existing = await query<{ admin_id: number }[]>('SELECT admin_id FROM admin WHERE email = ? LIMIT 1', [email])
  if (existing.length) return NextResponse.json({ success: false, message: 'Email already exists' })
  const password = generateRandomPassword()
  const now = formatDatetime()
  const result = await query<{ insertId: number }>('INSERT INTO admin (name,email,phone,password,status,created_by,created_on) VALUES(?,?,?,?,?,?,?)',
    [name, email, phone, String(password), 'Active', userId, now])
  const newId = result.insertId
  if (role_ids?.length) {
    for (const rid of role_ids) {
      await query('INSERT INTO user_roles (user_id,role_id,created_by,created_on) VALUES(?,?,?,?)', [newId, rid, userId, now])
    }
  }
  return NextResponse.json({ success: true, data: { admin_id: newId, password } })
}
