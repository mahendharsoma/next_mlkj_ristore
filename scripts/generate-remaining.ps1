# This script creates all remaining API routes and page stubs
$base = "C:\Users\dell\Downloads\stock-management-nextjs"

# Generic CRUD API template
function Write-CrudApi {
    param($table, $pk, $name, $path)
    $dir = "$base\app\api\$path"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    New-Item -ItemType Directory -Force -Path "$dir\[id]" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const rows = await query('SELECT * FROM $table ORDER BY $pk DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const cols = Object.keys(body)
  const vals = Object.values(body)
  const placeholders = cols.map(() => '?').join(',')
  const result = await query<{ insertId: number }>(
    `INSERT INTO $table (`+cols.join(',')+`,created_by,created_on) VALUES(`+placeholders+`,?,?)`,
    [...vals, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { $pk: result.insertId } })
}
"@ | Set-Content "$dir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const sets = Object.keys(body).map(k => k+'=?').join(',')
  const vals = Object.values(body)
  await query(`UPDATE $table SET `+sets+`,updated_by=?,updated_on=? WHERE $pk=?`, [...vals, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM $table WHERE $pk=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$dir\[id]\route.ts"
}

Write-CrudApi "category" "category_id" "category" "categories"
Write-CrudApi "vendors" "vendor_id" "vendor" "vendors"
Write-CrudApi "ps_or_deparment" "ps_department_id" "ps" "ps"
Write-CrudApi "purchase_orders" "purchase_order_id" "purchase-order" "purchase-orders"
Write-CrudApi "purchase_order_items" "item_id" "purchase-order-item" "purchase-order-items"

# Products API with category filter
$pdir = "$base\app\api\products"
New-Item -ItemType Directory -Force -Path "$pdir\[id]" | Out-Null
@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('category_id')
  let rows
  if (catId) {
    rows = await query('SELECT p.*,c.category_name FROM products p LEFT JOIN category c ON c.category_id=p.category_id WHERE p.category_id=? ORDER BY p.product_id DESC', [catId])
  } else {
    rows = await query('SELECT p.*,c.category_name FROM products p LEFT JOIN category c ON c.category_id=p.category_id ORDER BY p.product_id DESC')
  }
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_name, category_id, unit, flag } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO products(product_name,category_id,unit,flag,created_by,created_on) VALUES(?,?,?,?,?,?)',
    [product_name, category_id, unit, flag||0, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { product_id: result.insertId } })
}
"@ | Set-Content "$pdir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_name, category_id, unit, flag } = await req.json()
  await query('UPDATE products SET product_name=?,category_id=?,unit=?,flag=?,updated_by=?,updated_on=? WHERE product_id=?',
    [product_name, category_id, unit, flag||0, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM products WHERE product_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$pdir\[id]\route.ts"

# Requisitions API
$rdir = "$base\app\api\requisitions"
New-Item -ItemType Directory -Force -Path "$rdir\rejected" | Out-Null
New-Item -ItemType Directory -Force -Path "$rdir\by-status\[status]" | Out-Null
New-Item -ItemType Directory -Force -Path "$rdir\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "$rdir\[id]\status" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(`SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status != 'Rejected' ORDER BY r.requisition_id DESC`)
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product, quantity, reason_for_requisition } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO requisitions(product,quantity,reason_for_requisition,status,created_by,created_on) VALUES(?,?,?,?,?,?)',
    [product, quantity, reason_for_requisition, 'Requisition', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { requisition_id: result.insertId } })
}
"@ | Set-Content "$rdir\route.ts"

@"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query(`SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status='Rejected' ORDER BY r.requisition_id DESC`)
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$rdir\rejected\route.ts"

@"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { status: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT r.*,v.vendor_name FROM requisitions r LEFT JOIN vendors v ON v.vendor_id=r.vendor_id WHERE r.status=? ORDER BY r.requisition_id DESC', [params.status])
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$rdir\by-status\[status]\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product, quantity, reason_for_requisition } = await req.json()
  await query('UPDATE requisitions SET product=?,quantity=?,reason_for_requisition=?,updated_by=?,updated_on=? WHERE requisition_id=? AND status="Requisition"',
    [product, quantity, reason_for_requisition, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM requisitions WHERE requisition_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$rdir\[id]\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const { status, vendor_id, amount, po_number, po_date, rv_number, rv_date } = body
  await query(
    'UPDATE requisitions SET status=?,vendor_id=?,amount=?,po_number=?,po_date=?,rv_number=?,rv_date=?,updated_by=?,updated_on=? WHERE requisition_id=?',
    [status, vendor_id||null, amount||null, po_number||null, po_date||null, rv_number||null, rv_date||null, userId, formatDatetime(), params.id]
  )
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$rdir\[id]\status\route.ts"

# Indents API
$idir = "$base\app\api\indents"
New-Item -ItemType Directory -Force -Path "$idir\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "$idir\[id]\status" | Out-Null
New-Item -ItemType Directory -Force -Path "$idir\[id]\receipt" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT i.*,p.name as wing_name FROM indents i LEFT JOIN ps_or_deparment p ON p.ps_department_id=i.wing_id ORDER BY i.indent_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { wing_id, indent_name, indent_date, recived_by, general_number } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO indents(wing_id,indent_name,indent_date,recived_by,general_number,status,created_by,created_on) VALUES(?,?,?,?,?,?,?,?)',
    [wing_id, indent_name, indent_date, recived_by, general_number, 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { indent_id: result.insertId } })
}
"@ | Set-Content "$idir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { wing_id, indent_name, indent_date, recived_by, general_number } = await req.json()
  await query('UPDATE indents SET wing_id=?,indent_name=?,indent_date=?,recived_by=?,general_number=?,updated_by=?,updated_on=? WHERE indent_id=?',
    [wing_id, indent_name, indent_date, recived_by, general_number, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM indents WHERE indent_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$idir\[id]\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { status } = await req.json()
  await query('UPDATE indents SET status=?,updated_by=?,updated_on=? WHERE indent_id=?', [status, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$idir\[id]\status\route.ts"

@"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const indent = await query('SELECT i.*,p.name as wing_name FROM indents i LEFT JOIN ps_or_deparment p ON p.ps_department_id=i.wing_id WHERE i.indent_id=?', [params.id])
  const items = await query('SELECT ii.*,pr.product_name FROM indent_items ii LEFT JOIN products pr ON pr.product_id=ii.product_id WHERE ii.indent_id=?', [params.id])
  return NextResponse.json({ success: true, data: { indent: (indent as unknown[])[0], items } })
}
"@ | Set-Content "$idir\[id]\receipt\route.ts"

# Indent Items API
$iidir = "$base\app\api\indent-items"
New-Item -ItemType Directory -Force -Path "$iidir\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "$iidir\[id]\dispatch" | Out-Null

@"
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
    ? await query('SELECT ii.*,p.product_name FROM indent_items ii LEFT JOIN products p ON p.product_id=ii.product_id WHERE ii.indent_id=? ORDER BY ii.indent_item_id DESC', [indentId])
    : await query('SELECT ii.*,p.product_name FROM indent_items ii LEFT JOIN products p ON p.product_id=ii.product_id ORDER BY ii.indent_item_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { indent_id, product_id, order_stock } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO indent_items(indent_id,product_id,order_stock,sent_stock,status,created_by,created_on) VALUES(?,?,?,0,"Pending",?,?)',
    [indent_id, product_id, order_stock, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { indent_item_id: result.insertId } })
}
"@ | Set-Content "$iidir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { order_stock } = await req.json()
  await query('UPDATE indent_items SET order_stock=?,updated_by=?,updated_on=? WHERE indent_item_id=?', [order_stock, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM indent_items WHERE indent_item_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$iidir\[id]\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { sent_stock } = await req.json()
  const items = await query<{ product_id: number; indent_id: number }[]>('SELECT product_id,indent_id FROM indent_items WHERE indent_item_id=?', [params.id])
  if (!items.length) return NextResponse.json({ success: false, message: 'Item not found' })
  const { product_id, indent_id } = items[0]
  await query('UPDATE indent_items SET sent_stock=sent_stock+?,updated_by=?,updated_on=? WHERE indent_item_id=?', [sent_stock, userId, formatDatetime(), params.id])
  await query('UPDATE inventory_items SET available_stock=available_stock-?,updated_by=?,updated_on=? WHERE product_id=?', [sent_stock, userId, formatDatetime(), product_id])
  const indents = await query<{ wing_id: number }[]>('SELECT wing_id FROM indents WHERE indent_id=?', [indent_id])
  if (indents.length) {
    const ps_id = indents[0].wing_id
    const existing = await query<{ ps_item_id: number }[]>('SELECT ps_item_id FROM ps_items WHERE ps_department_id=? AND product_id=?', [ps_id, product_id])
    if (existing.length) {
      await query('UPDATE ps_items SET available_stock=available_stock+?,updated_by=?,updated_on=? WHERE ps_item_id=?', [sent_stock, userId, formatDatetime(), existing[0].ps_item_id])
    } else {
      await query('INSERT INTO ps_items(ps_department_id,product_id,available_stock,condemned_stock,created_by,created_on) VALUES(?,?,?,0,?,?)', [ps_id, product_id, sent_stock, userId, formatDatetime()])
    }
  }
  await query('INSERT INTO items_transactions(product_id,transaction_type,quantity,reference_id,reference_type,created_by,created_on) VALUES(?,?,?,?,?,?,?)',
    [product_id, 'Indent Dispatch', sent_stock, params.id, 'indent_item', userId, formatDatetime()])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$iidir\[id]\dispatch\route.ts"

# Inventory API
$invdir = "$base\app\api\inventory"
New-Item -ItemType Directory -Force -Path "$invdir\transactions" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('category_id')
  let rows
  if (catId) {
    rows = await query('SELECT p.*,c.category_name,COALESCE(i.available_stock,0) as available_stock FROM products p LEFT JOIN category c ON c.category_id=p.category_id LEFT JOIN inventory_items i ON i.product_id=p.product_id WHERE p.category_id=? ORDER BY p.product_id DESC', [catId])
  } else {
    rows = await query('SELECT p.*,c.category_name,COALESCE(i.available_stock,0) as available_stock FROM products p LEFT JOIN category c ON c.category_id=p.category_id LEFT JOIN inventory_items i ON i.product_id=p.product_id ORDER BY p.product_id DESC')
  }
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$invdir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  let rows
  if (productId) {
    rows = await query('SELECT t.*,p.product_name,a.name as created_by_name FROM items_transactions t LEFT JOIN products p ON p.product_id=t.product_id LEFT JOIN admin a ON a.admin_id=t.created_by WHERE t.product_id=? ORDER BY t.transaction_id DESC', [productId])
  } else {
    rows = await query('SELECT t.*,p.product_name,a.name as created_by_name FROM items_transactions t LEFT JOIN products p ON p.product_id=t.product_id LEFT JOIN admin a ON a.admin_id=t.created_by ORDER BY t.transaction_id DESC LIMIT 200')
  }
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$invdir\transactions\route.ts"

# Purchase Order Items stock
$poisdir = "$base\app\api\purchase-order-items"
New-Item -ItemType Directory -Force -Path "$poisdir\[id]\stock" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { received_qty } = await req.json()
  const items = await query<{ product_id: number }[]>('SELECT product_id FROM purchase_order_items WHERE item_id=?', [params.id])
  if (!items.length) return NextResponse.json({ success: false, message: 'Item not found' })
  const { product_id } = items[0]
  await query('UPDATE purchase_order_items SET received_stock=received_stock+?,updated_by=?,updated_on=? WHERE item_id=?', [received_qty, userId, formatDatetime(), params.id])
  const existing = await query<{ inventory_id: number }[]>('SELECT inventory_id FROM inventory_items WHERE product_id=?', [product_id])
  if (existing.length) {
    await query('UPDATE inventory_items SET available_stock=available_stock+?,updated_by=?,updated_on=? WHERE product_id=?', [received_qty, userId, formatDatetime(), product_id])
  } else {
    await query('INSERT INTO inventory_items(product_id,available_stock,flag_stock,created_by,created_on) VALUES(?,?,0,?,?)', [product_id, received_qty, userId, formatDatetime()])
  }
  await query('INSERT INTO items_transactions(product_id,transaction_type,quantity,reference_id,reference_type,created_by,created_on) VALUES(?,?,?,?,?,?,?)',
    [product_id, 'Purchase', received_qty, params.id, 'purchase_order_item', userId, formatDatetime()])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$poisdir\[id]\stock\route.ts"

# Chief Office Items API
$coiDir = "$base\app\api\chief-office-items"
New-Item -ItemType Directory -Force -Path "$coiDir\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "$coiDir\[id]\stock" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT poi.*,p.product_name FROM purchase_order_items poi LEFT JOIN products p ON p.product_id=poi.product_id WHERE poi.purchase_order_id=0 ORDER BY poi.item_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_id, quantity, unit_price } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO purchase_order_items(purchase_order_id,product_id,quantity,unit_price,received_stock,status,created_by,created_on) VALUES(0,?,?,?,0,"Pending",?,?)',
    [product_id, quantity, unit_price, userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { item_id: result.insertId } })
}
"@ | Set-Content "$coiDir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { product_id, quantity, unit_price } = await req.json()
  await query('UPDATE purchase_order_items SET product_id=?,quantity=?,unit_price=?,updated_by=?,updated_on=? WHERE item_id=?',
    [product_id, quantity, unit_price, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM purchase_order_items WHERE item_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$coiDir\[id]\route.ts"

# Copy stock route for chief office
Copy-Item "$poisdir\[id]\stock\route.ts" "$coiDir\[id]\stock\route.ts"

# Wing Users API
$wuDir = "$base\app\api\wing-users"
New-Item -ItemType Directory -Force -Path "$wuDir\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "$wuDir\[id]\status" | Out-Null

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const wingId = searchParams.get('wing_id')
  const rows = wingId
    ? await query('SELECT wu.*,a.name as user_name,p.name as wing_name FROM wing_users wu LEFT JOIN admin a ON a.admin_id=wu.user_id LEFT JOIN ps_or_deparment p ON p.ps_department_id=wu.ps_department_id WHERE wu.ps_department_id=? ORDER BY wu.wing_user_id DESC', [wingId])
    : await query('SELECT wu.*,a.name as user_name,p.name as wing_name FROM wing_users wu LEFT JOIN admin a ON a.admin_id=wu.user_id LEFT JOIN ps_or_deparment p ON p.ps_department_id=wu.ps_department_id ORDER BY wu.wing_user_id DESC')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { user_id, ps_department_id } = await req.json()
  const result = await query<{ insertId: number }>(
    'INSERT INTO wing_users(user_id,ps_department_id,status,created_by,created_on) VALUES(?,?,?,?,?)',
    [user_id, ps_department_id, 'Active', userId, formatDatetime()]
  )
  return NextResponse.json({ success: true, data: { wing_user_id: result.insertId } })
}
"@ | Set-Content "$wuDir\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { user_id, ps_department_id } = await req.json()
  await query('UPDATE wing_users SET user_id=?,ps_department_id=?,updated_by=?,updated_on=? WHERE wing_user_id=?', [user_id, ps_department_id, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  await query('DELETE FROM wing_users WHERE wing_user_id=?', [params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$wuDir\[id]\route.ts"

@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { status } = await req.json()
  await query('UPDATE wing_users SET status=?,updated_by=?,updated_on=? WHERE wing_user_id=?', [status, userId, formatDatetime(), params.id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$wuDir\[id]\status\route.ts"

# PS Items, Condemnation, Settings, Profile APIs
$psItemsDir = "$base\app\api\ps-items"
New-Item -ItemType Directory -Force -Path $psItemsDir | Out-Null
@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  const rows = psId
    ? await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id WHERE ps.ps_department_id=? ORDER BY ps.ps_item_id DESC', [psId])
    : await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id ORDER BY ps.ps_item_id DESC')
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$psItemsDir\route.ts"

$condDir = "$base\app\api\condemnation"
New-Item -ItemType Directory -Force -Path "$condDir\ps-list\[ps_id]" | Out-Null
@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const psId = searchParams.get('ps_id')
  const rows = psId
    ? await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id WHERE ps.ps_department_id=? AND ps.condemned_stock>0', [psId])
    : await query('SELECT ps.*,p.product_name,d.name as ps_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id LEFT JOIN ps_or_deparment d ON d.ps_department_id=ps.ps_department_id WHERE ps.condemned_stock>0')
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { ps_item_id, condemned_qty } = await req.json()
  await query('UPDATE ps_items SET available_stock=available_stock-?,condemned_stock=condemned_stock+?,updated_by=?,updated_on=? WHERE ps_item_id=?',
    [condemned_qty, condemned_qty, userId, formatDatetime(), ps_item_id])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$condDir\route.ts"

@"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { ps_id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT ps.*,p.product_name FROM ps_items ps LEFT JOIN products p ON p.product_id=ps.product_id WHERE ps.ps_department_id=? AND ps.condemned_stock>0', [params.ps_id])
  return NextResponse.json({ success: true, data: rows })
}
"@ | Set-Content "$condDir\ps-list\[ps_id]\route.ts"

$settingsDir = "$base\app\api\settings"
New-Item -ItemType Directory -Force -Path $settingsDir | Out-Null
@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const rows = await query('SELECT * FROM settings')
  return NextResponse.json({ success: true, data: rows })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { settings } = await req.json()
  for (const [key, value] of Object.entries(settings)) {
    const existing = await query<{ setting_id: number }[]>('SELECT setting_id FROM settings WHERE setting_key=?', [key])
    if (existing.length) {
      await query('UPDATE settings SET setting_value=?,updated_by=?,updated_on=? WHERE setting_key=?', [value, userId, formatDatetime(), key])
    } else {
      await query('INSERT INTO settings(setting_key,setting_value,updated_by,updated_on) VALUES(?,?,?,?)', [key, value, userId, formatDatetime()])
    }
  }
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$settingsDir\route.ts"

$profileDir = "$base\app\api\profile"
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
@"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const rows = await query('SELECT admin_id,name,email,phone,profile_image,status FROM admin WHERE admin_id=?', [userId])
  return NextResponse.json({ success: true, data: (rows as unknown[])[0] })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const userId = (session.user as { id: string }).id
  const { name, email, phone } = await req.json()
  await query('UPDATE admin SET name=?,email=?,phone=?,updated_by=?,updated_on=? WHERE admin_id=?', [name, email, phone, userId, formatDatetime(), userId])
  return NextResponse.json({ success: true })
}
"@ | Set-Content "$profileDir\route.ts"

Write-Host "All API routes generated successfully!" -ForegroundColor Green
