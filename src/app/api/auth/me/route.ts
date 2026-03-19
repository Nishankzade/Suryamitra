// src/app/api/auth/me/route.ts
// GET /api/auth/me — returns the current logged-in user from JWT cookie

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const token = request.cookies.get('suryamitra_token')?.value

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
        // Token invalid or expired — clear it
        const response = NextResponse.json({ user: null }, { status: 401 })
        response.cookies.delete('suryamitra_token')
        return response
    }

    // Fetch full user data from database
    try {
        const { getUserById } = await import('@/lib/db')
        const fullUser = await getUserById(payload.userId)
        
        return NextResponse.json({ user: fullUser })
    } catch (error) {
        console.error('Error fetching user data:', error)
        return NextResponse.json({ user: payload }, { status: 200 })
    }
}
