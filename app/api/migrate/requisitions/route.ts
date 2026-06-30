import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST() {
  try {
    // Add rejection_reason column for reject functionality
    try {
      await query(`ALTER TABLE requisitions ADD COLUMN rejection_reason TEXT NULL`)
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        throw err
      }
    }

    return NextResponse.json({ success: true, message: 'Migration completed - added rejection_reason column' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
 