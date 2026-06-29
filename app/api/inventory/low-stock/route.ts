import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, data: [] }, { status: 401 })

    let rows: any[] = []

    try {
      rows = await query(
        `SELECT p.product_name, COALESCE(i.available_stock,0) as available_stock
         FROM products p
         LEFT JOIN inventory_items i ON i.product_id = p.product_id
         WHERE p.flag > 0 AND COALESCE(i.available_stock,0) <= p.flag`
      ) as any[]
    } catch {
      try {
        rows = await query(
          `SELECT p.product_name, COALESCE(i.available_stock,0) as available_stock
           FROM products p
           LEFT JOIN inventory_items i ON i.product_id = p.product_id
           WHERE p.stock_flag > 0 AND COALESCE(i.available_stock,0) <= p.stock_flag`
        ) as any[]
      } catch {
        rows = []
      }
    }

    return NextResponse.json({ success: true, data: rows })
  } catch (err: any) {
    return NextResponse.json({ success: true, data: [] })
  }
}
