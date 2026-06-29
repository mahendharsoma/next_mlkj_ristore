import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const indentId = searchParams.get('indent_id')
  const rows = indentId
    ? await query('SELECT ii.*,p.product_name,c.category_name,COALESCE(inv.available_stock,0) as available_stock FROM indent_items ii LEFT JOIN products p ON p.product_id=ii.product_id LEFT JOIN category c ON c.category_id=ii.category_id LEFT JOIN inventory_items inv ON inv.product_id=ii.product_id WHERE ii.indent_id=? ORDER BY ii.indent_item_id DESC', [indentId])
    : await query('SELECT ii.*,p.product_name,c.category_name FROM indent_items ii LEFT JOIN products p ON p.product_id=ii.product_id LEFT JOIN category c ON c.category_id=ii.category_id ORDER BY ii.indent_item_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { indent_id, category_id, product_id, order_stock, recived_by, general_number } = await req.json()

    const indents = await query<{ wing_id: number }[]>('SELECT wing_id FROM indents WHERE indent_id=?', [indent_id])
    if (!indents.length) return NextResponse.json({ success: false, message: 'Indent not found' })
    const psId = indents[0].wing_id

    const inventory = await query<{ available_stock: number }[]>('SELECT available_stock FROM inventory_items WHERE product_id=?', [product_id])
    if (!inventory.length) return NextResponse.json({ success: false, message: 'Product not available in inventory' })
    const available = Number(inventory[0].available_stock)
    if (available < Number(order_stock)) return NextResponse.json({ success: false, message: 'Insufficient inventory stock' })

    const result = await query<{ insertId: number }>(
      'INSERT INTO indent_items(indent_id,category_id,product_id,order_stock,sent_stock,recived_by,general_number,created_by,created_on) VALUES(?,?,?,?,?,?,?,?,?)',
      [indent_id, category_id, product_id, order_stock, order_stock, recived_by, general_number, userId, formatDatetime()]
    )
    const indentItemId = result.insertId

    await query('UPDATE inventory_items SET available_stock=available_stock-?,updated_by=?,updated_on=? WHERE product_id=?',
      [order_stock, userId, formatDatetime(), product_id])

    const existing = await query<{ ps_item_id: number }[]>('SELECT ps_item_id FROM ps_items WHERE ps_department_id=? AND product_id=?', [psId, product_id])
    if (existing.length) {
      await query('UPDATE ps_items SET stock=stock+?,updated_by=?,updated_on=? WHERE ps_item_id=?',
        [order_stock, userId, formatDatetime(), existing[0].ps_item_id])
    } else {
      await query('INSERT INTO ps_items(ps_department_id,product_id,stock,created_by,created_on) VALUES(?,?,?,?,?)',
        [psId, product_id, order_stock, userId, formatDatetime()])
    }

    await query('INSERT INTO items_transactions(item_id,ps_departemt_id,product_id,stock,added_on,price,type_of_transaction,created_by,created_on) VALUES(?,?,?,?,?,?,?,?,?)',
      [indentItemId, psId, product_id, order_stock, formatDatetime(), 0, 'transfering', userId, formatDatetime()])

    return NextResponse.json({ success: true, data: { indent_item_id: indentItemId } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to add indent item' }, { status: 500 })
  }
}
