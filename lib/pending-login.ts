import crypto from 'crypto'
import { cookies } from 'next/headers'

export const PENDING_LOGIN_COOKIE = 'pending_login'
export const PENDING_LOGIN_MAX_AGE = 15 * 60
export const OTP_EXPIRY_SECONDS = 5 * 60
export const OTP_RESEND_COOLDOWN_SECONDS = 60

export interface PendingLoginPayload {
  adminId: number
  email: string
  registeredPhone: string
  exp: number
  otpSentAt?: number
  mobile?: string
}

export interface LoginTokenPayload {
  adminId: number
  email: string
  jti: string
  exp: number
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return secret
}

function signPayload(payload: object): string {
  const secret = getSecret()
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verifySignedPayload<T extends { exp: number }>(token: string): T | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [data, sig] = parts
  const secret = getSecret()
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function createPendingLoginToken(payload: Omit<PendingLoginPayload, 'exp'> & { exp?: number }): string {
  const exp = payload.exp ?? Math.floor(Date.now() / 1000) + PENDING_LOGIN_MAX_AGE
  return signPayload({ ...payload, exp })
}

export function verifyPendingLoginToken(token: string): PendingLoginPayload | null {
  return verifySignedPayload<PendingLoginPayload>(token)
}

export function createLoginToken(adminId: number, email: string): string {
  const exp = Math.floor(Date.now() / 1000) + 120
  const jti = crypto.randomBytes(16).toString('hex')
  return signPayload({ adminId, email, jti, exp })
}

export function verifyLoginToken(token: string): LoginTokenPayload | null {
  return verifySignedPayload<LoginTokenPayload>(token)
}

export async function getPendingLogin(): Promise<PendingLoginPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(PENDING_LOGIN_COOKIE)?.value
  if (!token) return null
  return verifyPendingLoginToken(token)
}

export async function setPendingLoginCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(PENDING_LOGIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PENDING_LOGIN_MAX_AGE,
  })
}

export async function clearPendingLoginCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PENDING_LOGIN_COOKIE)
}

export function getResendCooldownRemaining(otpSentAt?: number): number {
  if (!otpSentAt) return 0
  const elapsed = Math.floor(Date.now() / 1000) - otpSentAt
  return Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - elapsed)
}
