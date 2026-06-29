import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { query } from './db'

interface AdminRow {
  admin_id: number
  name: string
  email: string
  phone: string
  password: string
  status: string
}

interface RoleRow { role_name: string }

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const rows = await query<AdminRow[]>(
          'SELECT admin_id, name, email, phone, password, status FROM admin WHERE email = ? LIMIT 1',
          [credentials.email]
        )
        if (!rows.length) return null
        const user = rows[0]
        if (user.status !== 'Active') return null
        if (user.password !== credentials.password) return null
        const roleRows = await query<RoleRow[]>(
          'SELECT r.role_name FROM user_roles ur JOIN roles r ON r.role_id=ur.role_id WHERE ur.user_id=?',
          [user.admin_id]
        )
        const roles = roleRows.map(r => r.role_name)
        return { id: String(user.admin_id), name: user.name, email: user.email, phone: user.phone, roles }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
        token.roles = (user as any).roles
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as { id?: string; phone?: string; roles?: string[] }
        u.id = token.id as string
        u.phone = token.phone as string
        u.roles = token.roles as string[]
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
