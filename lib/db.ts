import mysql, { ExecuteValues } from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'mlkgri',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
  const [rows] = await pool.execute(sql, params as ExecuteValues)
  return rows as T
}

export function formatDatetime(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const values = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value
    return acc
  }, {})

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}

export default pool
