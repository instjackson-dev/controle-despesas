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
    const loginUrl = new URL('/login', process.env.NEXTAUTH_URL ?? req.url)
    loginUrl.searchParams.set('callbackUrl', process.env.NEXTAUTH_URL ?? req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
}
