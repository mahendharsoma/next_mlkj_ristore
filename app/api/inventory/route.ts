import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('category_id')
  const rows = catId
    ? await query('SELECT p.*,c.category_name,COALESCE(i.total_stock,0) as total_stock,COALESCE(i.available_stock,0) as available_stock FROM products p LEFT JOIN category c ON c.category_id=p.category_id LEFT JOIN inventory_items i ON i.product_id=p.product_id WHERE p.category_id=? ORDER BY p.product_id DESC', [catId])
    : await query('SELECT p.*,c.category_name,COALESCE(i.total_stock,0) as total_stock,COALESCE(i.available_stock,0) as available_stock FROM products p LEFT JOIN category c ON c.category_id=p.category_id LEFT JOIN inventory_items i ON i.product_id=p.product_id ORDER BY p.product_id DESC')
  return NextResponse.json({ success: true, data: rows })
}
