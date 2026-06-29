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
    const items = await query<{ product_id: number; category_id: number; order_stock: number; recived_stock: number }[]>(
      'SELECT product_id, category_id, order_stock, recived_stock FROM purchase_order_items WHERE item_id=?', [params.id]
    )
    if (!items.length) return NextResponse.json({ success: false, message: 'Item not found' })
    const { product_id, category_id, order_stock, recived_stock } = items[0]
    const newReceived = Number(recived_stock) + Number(stock)
    if (newReceived > order_stock) return NextResponse.json({ success: false, message: 'Received stock exceeds order stock' })
    await query('UPDATE purchase_order_items SET recived_stock=?,balance_stock=?,updated_by=?,updated_on=? WHERE item_id=?',
      [newReceived, order_stock - newReceived, userId, formatDatetime(), params.id])
    const existing = await query<{ inventory_item_id: number }[]>('SELECT inventory_item_id FROM inventory_items WHERE product_id=?', [product_id])
    if (existing.length) {
      await query('UPDATE inventory_items SET total_stock=total_stock+?,available_stock=available_stock+?,updated_by=?,updated_on=? WHERE product_id=?',
        [stock, stock, userId, formatDatetime(), product_id])
    } else {
      await query('INSERT INTO inventory_items(category_id,product_id,total_stock,available_stock,created_by,created_on) VALUES(?,?,?,?,?,?)',
        [category_id, product_id, stock, stock, userId, formatDatetime()])
    }
    const addedOn = date ? `${date} 00:00:00` : formatDatetime()
    await query('INSERT INTO items_transactions(item_id,product_id,stock,added_on,type_of_transaction,created_by,created_on) VALUES(?,?,?,?,?,?,?)',
      [params.id, product_id, stock, addedOn, 'added', userId, formatDatetime()])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to add stock' }, { status: 500 })
  }
}
