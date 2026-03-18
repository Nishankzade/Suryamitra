// src/middleware.ts
// Runs on EVERY request before page loads (Edge Runtime)
// Uses `jose` (Edge-compatible JWT) instead of `jsonwebtoken`

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  return secret ? new TextEncoder().encode(secret) : null
}

// Routes that do NOT need login
const PUBLIC_ROUTES = ['/login', '/register']

// Routes that DO need login
const PROTECTED_ROUTES = ['/chat', '/dashboard']

async function verifyJWT(token: string) {
  try {
    const secret = getJwtSecret()
    if (!secret) return null
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; email: string; name: string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get JWT token from cookie
  const token = request.cookies.get('suryamitra_token')?.value

  const isPublicRoute =
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) || pathname === '/'
  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r))

  // ---- If trying to access a protected route ----
  if (isProtectedRoute) {
    if (!token) {
      // No token → redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      // Token invalid or expired → clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('suryamitra_token')
      return response
    }

    // Token valid → allow access and pass user info via headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-name', payload.name)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ---- If already logged in and visiting login/register ----
  if (isPublicRoute && token) {
    const payload = await verifyJWT(token)
    if (payload && (pathname === '/login' || pathname === '/register')) {
      // Already logged in → redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}