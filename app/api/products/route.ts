import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('category_id')
  const rows = catId
    ? await query('SELECT p.*,c.category_name FROM products p LEFT JOIN category c ON c.category_id=p.category_id WHERE p.category_id=? ORDER BY p.product_id DESC', [catId])
    : await query('SELECT p.*,c.category_name FROM products p LEFT JOIN category c ON c.category_id=p.category_id ORDER BY p.product_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_name, category_id, stock_flag, status } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO products(product_name,category_id,stock_flag,status,created_by,created_on) VALUES(?,?,?,?,?,?)',
    [product_name, category_id, stock_flag || 0, status || 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { product_id: result.insertId } })
}
