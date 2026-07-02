import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { query } from './db'
import { verifyLoginToken } from './pending-login'

interface AdminRow {
  admin_id: number
  name: string
  email: string
  phone: string
  status: string
}

interface RoleRow { role_name: string }

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        loginToken: { label: 'Login Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.loginToken) return null

        const payload = verifyLoginToken(credentials.loginToken)
        if (!payload) return null

        const rows = await query<AdminRow[]>(
          'SELECT admin_id, name, email, phone, status FROM admin WHERE admin_id = ? LIMIT 1',
          [payload.adminId]
        )
        if (!rows.length) return null

        const user = rows[0]
        if (user.status !== 'Active') return null
        if (user.email !== payload.email) return null

        const roleRows = await query<RoleRow[]>(
          'SELECT r.role_name FROM user_roles ur JOIN roles r ON r.role_id=ur.role_id WHERE ur.user_id=?',
          [user.admin_id]
        )
        const roles = roleRows.map(r => r.role_name)

        return {
          id: String(user.admin_id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          roles,
        }
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
        token.phone = (user as { phone?: string }).phone
        token.roles = (user as { roles?: string[] }).roles
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
