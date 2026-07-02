import { NextResponse } from 'next/server'
import { clearPendingLoginCookie } from '@/lib/pending-login'

export async function POST() {
  try {
    await clearPendingLoginCookie()
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
