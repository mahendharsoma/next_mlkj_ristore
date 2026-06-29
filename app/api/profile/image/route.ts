import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const userId = (session.user as { id: string }).id

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ success: false, message: 'No image provided' })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ success: false, message: 'Only JPG, PNG, GIF, WEBP images allowed' })
    }

    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `profile_${userId}_${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    await query(
      'UPDATE admin SET profile_image=?,updated_by=?,updated_on=? WHERE admin_id=?',
      [filename, userId, formatDatetime(), userId]
    )

    return NextResponse.json({ success: true, filename, url: `/uploads/profile/${filename}` })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Upload failed' }, { status: 500 })
  }
}
