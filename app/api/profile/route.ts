import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const rows = await query('SELECT admin_id,name,email,phone,status,profile_image FROM admin WHERE admin_id=?', [userId])
  return NextResponse.json({ success: true, data: (rows as unknown[])[0] })
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const { type, current_password, new_password } = await req.json()
      if (type === 'password') {
        if (!current_password || !new_password) {
          return NextResponse.json({ success: false, message: 'Fill all fields' })
        }
        const rows = await query<{ password: string }[]>('SELECT password FROM admin WHERE admin_id=?', [userId])
        if (!rows.length || rows[0].password !== current_password) {
          return NextResponse.json({ success: false, message: 'Current password is incorrect' })
        }
        await query('UPDATE admin SET password=?,updated_by=?,updated_on=? WHERE admin_id=?',
          [new_password, userId, formatDatetime(), userId])
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ success: false, message: 'Unknown type' })
    }

    const formData = await req.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const imageFile = formData.get('image') as File | null

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' })
    }

    let profileImage: string | null = null
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = imageFile.name.split('.').pop()
      const filename = `profile_${userId}_${Date.now()}.${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)
      profileImage = filename
    }

    if (profileImage) {
      await query('UPDATE admin SET name=?,email=?,phone=?,profile_image=?,updated_by=?,updated_on=? WHERE admin_id=?',
        [name, email, phone, profileImage, userId, formatDatetime(), userId])
    } else {
      await query('UPDATE admin SET name=?,email=?,phone=?,updated_by=?,updated_on=? WHERE admin_id=?',
        [name, email, phone, userId, formatDatetime(), userId])
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
