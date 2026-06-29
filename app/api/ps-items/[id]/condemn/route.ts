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

    if (!stock || Number(stock) <= 0) return NextResponse.json({ success: false, message: 'Enter valid condemnation stock' })

    const items = await query<{ product_id: number; ps_department_id: number; stock: number }[]>(
      'SELECT product_id, ps_department_id, stock FROM ps_items WHERE ps_item_id=?', [params.id]
    )
    if (!items.length) return NextResponse.json({ success: false, message: 'PS item not found' })
    const { product_id, ps_department_id, stock: psStock } = items[0]

    if (Number(psStock) < Number(stock)) return NextResponse.json({ success: false, message: 'Condemnation stock exceeds available stock' })

    await query('UPDATE ps_items SET stock=stock-?,updated_by=?,updated_on=? WHERE ps_item_id=?',
      [stock, userId, formatDatetime(), params.id])

    const addedOn = date ? `${date} 00:00:00` : formatDatetime()
    await query('INSERT INTO items_transactions(item_id,ps_departemt_id,product_id,stock,added_on,price,type_of_transaction,created_by,created_on) VALUES(?,?,?,?,?,?,?,?,?)',
      [params.id, ps_department_id, product_id, stock, addedOn, 0, 'condemnation', userId, formatDatetime()])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to condemn' }, { status: 500 })
  }
}
