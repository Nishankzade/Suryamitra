// src/lib/auth.ts
// JWT token creation and verification - using jose for consistency

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_EXPIRES = '7d' // token valid for 7 days

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

// ============================================================
// PASSWORD UTILITIES
// ============================================================

// Hash password before saving to DB (NEVER save plain text passwords)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12) // 12 = salt rounds (higher = more secure, slower)
}

// Compare plain password with hashed password from DB
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

// ============================================================
// JWT TOKEN UTILITIES
// ============================================================

export interface TokenPayload {
  userId: string
  email: string
  name: string
}

// Create JWT token after successful login
export async function createToken(payload: TokenPayload): Promise<string> {
  const secret = getJwtSecret()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(secret)
}

// Verify JWT token (used in middleware and API routes)
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload as TokenPayload
  } catch {
    return null // token expired or invalid
  }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true, message: '' }
}

export function validateMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile) // Indian mobile number format
}
