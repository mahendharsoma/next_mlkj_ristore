import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const publicPaths = ['/login', '/forgot-password', '/reset-password']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (pathname === '/') {
      return token
        ? NextResponse.redirect(new URL('/dashboard', req.url))
        : NextResponse.redirect(new URL('/login', req.url))
    }

    if (token && publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (!token && pathname === '/otp-verification') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
        return pathname === '/' || isPublicPath || !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
