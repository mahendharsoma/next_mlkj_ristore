import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, formatDatetime } from '@/lib/db'

async function sendSmsApi(mobile: string, otp: number) {
  const message = `Your Mobile Validation OTP IS : ${otp} REGARDS - CYBERABAD POLICE COMMISSIONERATE`
  const url = 'http://103.153.58.65/api/v2/SendSMS'
  const postData = {
    senderId: 'CYBPOL',
    is_Unicode: false,
    is_Flash: false,
    dataCoding: 0,
    message,
    mobileNumbers: '91' + mobile,
    apiKey: 'S2aw5yMyupRDK+o3K/Y1LsJsFXJ7LUN+iJ7+hJe6pi4=',
    clientId: '762fe3cf-4d0c-4933-9cbf-553178d8e4db',
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })
    const json = await res.json()
    if (json?.ErrorCode !== undefined && json.ErrorCode !== 0) {
      return { success: false, error: json.ErrorDescription || 'SMS API Error' }
    }
    return { success: true, response: json }
  } catch (err: any) {
    return { success: false, error: err.message || 'SMS send failed' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id: string }).id
    const { mobile } = await req.json()

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Enter a valid 10-digit mobile number' })
    }

    const rows = await query<{ phone: string }[]>('SELECT phone FROM admin WHERE admin_id=?', [userId])
    if (!rows.length) return NextResponse.json({ success: false, message: 'User not found' })
    if (rows[0].phone !== mobile) {
      return NextResponse.json({ success: false, message: 'Phone number does not match your registered number' })
    }

    const otp = Math.floor(1000 + Math.random() * 9000)

    await query('UPDATE admin SET otp=?,updated_by=?,updated_on=? WHERE admin_id=?',
      [otp, userId, formatDatetime(), userId])

    const sms = await sendSmsApi(mobile, otp)
    if (!sms.success) {
      return NextResponse.json({ success: false, message: `SMS Error: ${sms.error}` })
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your mobile number. Please enter the OTP.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
