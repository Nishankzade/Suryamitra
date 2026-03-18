// src/app/api/auth/register/route.ts
// POST /api/auth/register — creates a new user account

import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, validateEmail, validatePassword, createToken } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, mobile } = body

    // ---- VALIDATION ----
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      )
    }

    // ---- CHECK IF EMAIL ALREADY EXISTS ----
    const existingUser = await getUserByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login.' },
        { status: 409 }
      )
    }

    // ---- HASH PASSWORD & CREATE USER ----
    const hashedPassword = await hashPassword(password)
    const newUser = await createUser(
      name.trim(),
      email.toLowerCase(),
      hashedPassword,
      mobile || null
    )

    // ---- CREATE JWT TOKEN ----
    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    })

    // ---- SET COOKIE & RETURN SUCCESS ----
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    })

    // Set JWT in httpOnly cookie (most secure way)
    response.cookies.set('suryamitra_token', token, {
      httpOnly: true,           // JS cannot access this cookie (prevents XSS)
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response

  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error?.message || String(error) || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
