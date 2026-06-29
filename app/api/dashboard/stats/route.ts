import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const [staff] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM admin WHERE status = "Active"')
    const [vendors] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM vendors')
    const [categories] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM category')
    const [products] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM products')
    const [reqCount] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM requisitions WHERE status = "Requisition"')
    const [underCommittee] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM requisitions WHERE status IN ("Permitted","Quotation")')
    const [poPending] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM requisitions WHERE status IN ("Committee","Approved")')
    const [billsPending] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM requisitions WHERE status = "PO"')
    const [fileTransfer] = await query<{ c: number }[]>('SELECT COUNT(*) as c FROM requisitions WHERE status = "File Transfer to Superdent Store"')

    let lowStock: { product_name: string; available_stock: number }[] = []
    try {
      lowStock = await query<{ product_name: string; available_stock: number }[]>(
        `SELECT p.product_name, i.available_stock
         FROM products p
         JOIN inventory_items i ON p.product_id=i.product_id
         WHERE p.flag>0 AND i.available_stock<=p.flag`
      )
    } catch (_) {
      lowStock = []
    }

    return NextResponse.json({
      success: true,
      data: {
        staff: staff.c, vendors: vendors.c, categories: categories.c, products: products.c,
        requisition: reqCount.c, underCommittee: underCommittee.c,
        poPending: poPending.c, billsPending: billsPending.c, fileTransfer: fileTransfer.c,
        lowStock,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
