// src/app/api/auth/logout/route.ts
// POST /api/auth/logout — clears the JWT cookie

import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })

  // Clear the cookie
  response.cookies.set('suryamitra_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  })

  return response
}
