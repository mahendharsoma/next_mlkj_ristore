export function formatDatetime(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export function formatDisplayDate(dateStr: string | null | undefined, includeTime = false): string {
  if (!dateStr) return '-'

  const d = new Date(dateStr)
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  })

  return formatter.format(d)
}

export function generateRandomPassword(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

export function generateOTP(): number {
  return Math.floor(1000 + Math.random() * 9000)
}

export const REQUISITION_STATUSES = [
  'Requisition',
  'Permitted',
  'Rejected',
  'Quotation',
  'Sanction',
  'TG/TS',
  'Tender',
  'Committee',
  'Approved',
  'PO',
  'File Transfer to Superdent Store',
] as const

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

export const STATUS_BADGE_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Requisition: 'bg-blue-100 text-blue-800',
  Permitted: 'bg-indigo-100 text-indigo-800',
  Rejected: 'bg-red-100 text-red-800',
  Quotation: 'bg-cyan-100 text-cyan-800',
  Committee: 'bg-orange-100 text-orange-800',
  Approved: 'bg-teal-100 text-teal-800',
  PO: 'bg-purple-100 text-purple-800',
  'File Transfer to Superdent Store': 'bg-gray-100 text-gray-800',
  Sanction: 'bg-pink-100 text-pink-800',
  'TG/TS': 'bg-lime-100 text-lime-800',
  Tender: 'bg-amber-100 text-amber-800',
}
