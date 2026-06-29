import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { stock, date } = await req.json()

    const items = await query<{ product_id: number; indent_id: number; order_stock: number; sent_stock: number }[]>(
      'SELECT product_id,indent_id,order_stock,sent_stock FROM indent_items WHERE indent_item_id=?', [params.id]
    )
    if (!items.length) return NextResponse.json({ success: false, message: 'Item not found' })
    const { product_id, indent_id, order_stock, sent_stock } = items[0]
    const newSent = Number(sent_stock) + Number(stock)
    if (newSent > order_stock) return NextResponse.json({ success: false, message: 'Sent stock exceeds order stock' })

    await query('UPDATE indent_items SET sent_stock=?,updated_by=?,updated_on=? WHERE indent_item_id=?',
      [newSent, userId, formatDatetime(), params.id])
    await query('UPDATE inventory_items SET available_stock=available_stock-?,updated_by=?,updated_on=? WHERE product_id=?',
      [stock, userId, formatDatetime(), product_id])

    const indents = await query<{ wing_id: number }[]>('SELECT wing_id FROM indents WHERE indent_id=?', [indent_id])
    if (indents.length) {
      const ps_id = indents[0].wing_id
      const existing = await query<{ ps_item_id: number }[]>(
        'SELECT ps_item_id FROM ps_items WHERE ps_department_id=? AND product_id=?', [ps_id, product_id]
      )
      if (existing.length) {
        await query('UPDATE ps_items SET stock=stock+?,updated_by=?,updated_on=? WHERE ps_item_id=?',
          [stock, userId, formatDatetime(), existing[0].ps_item_id])
      } else {
        await query('INSERT INTO ps_items(ps_department_id,product_id,stock,created_by,created_on) VALUES(?,?,?,?,?)',
          [ps_id, product_id, stock, userId, formatDatetime()])
      }
    }

    const addedOn = date ? `${date} 00:00:00` : formatDatetime()
    await query('INSERT INTO items_transactions(item_id,ps_departemt_id,product_id,stock,added_on,price,type_of_transaction,created_by,created_on) VALUES(?,?,?,?,?,?,?,?,?)',
      [params.id, ps_id, product_id, stock, addedOn, 0, 'transfering', userId, formatDatetime()])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to dispatch' }, { status: 500 })
  }
}
