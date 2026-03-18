// src/app/api/user/profile/route.ts - Update user profile (name, age)

import { NextRequest, NextResponse } from 'next/server'
import { updateUserProfile, getUserById } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Verify JWT token and get user ID
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.userId
  } catch {
    return null
  }
}

// PUT - Update user profile (name, age, state, city, occupation, roof_size, energy_needs, additionalInfo)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, age, state, city, occupation, roofSize, energyNeeds, additionalInfo } = body

    // Validate age if provided
    if (age !== undefined && (age < 5 || age > 100)) {
      return NextResponse.json({ error: 'Age must be between 5 and 100' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await updateUserProfile(
      userId, 
      name || undefined, 
      age !== undefined ? Number(age) : undefined,
      state || undefined,
      city || undefined,
      occupation || undefined,
      roofSize || undefined,
      energyNeeds || undefined,
      additionalInfo || undefined
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
