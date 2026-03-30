// middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  })

  if (!token) {
    const baseUrl = process.env.NEXTAUTH_URL?.startsWith('http')
      ? process.env.NEXTAUTH_URL
      : `https://${process.env.NEXTAUTH_URL}`
    const loginUrl = new URL('/login', baseUrl)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
}
