import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const indent = await query(
    'SELECT i.*,p.name as wing_name FROM indents i LEFT JOIN ps_or_deparment p ON p.ps_department_id=i.wing_id WHERE i.indent_id=?',
    [params.id]
  )
  const items = await query(
    'SELECT ii.*,pr.product_name FROM indent_items ii LEFT JOIN products pr ON pr.product_id=ii.product_id WHERE ii.indent_id=?',
    [params.id]
  )
  return NextResponse.json({ success: true, data: { indent: (indent as unknown[])[0], items } })
}
