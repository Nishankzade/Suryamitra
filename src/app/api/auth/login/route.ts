// src/app/api/auth/login/route.ts
// POST /api/auth/login — verifies credentials and logs user in

import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken, validateEmail } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ---- VALIDATION ----
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // ---- FIND USER IN DB ----
    const user = await getUserByEmail(email.toLowerCase())
    if (!user) {
      // Use generic message — don't tell attacker if email exists
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ---- VERIFY PASSWORD ----
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ---- CREATE JWT TOKEN ----
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    })

    // ---- SET COOKIE & RETURN SUCCESS ----
    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        state: user.state,
        occupation: user.occupation,
      },
    })

    response.cookies.set('suryamitra_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// GET /api/auth/login — get current user info from token
export async function GET(request: NextRequest) {
  const token = request.cookies.get('suryamitra_token')?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const { verifyToken } = await import('@/lib/auth')
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user: payload })
}
