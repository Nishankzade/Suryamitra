// src/app/api/chat/conversations/route.ts
// GET /api/chat/conversations — Returns user's past conversations

import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUserConversations } from '@/lib/db'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('suryamitra_token')?.value
    if (!token) {
      return Response.json({ error: 'Please login again' }, { status: 401 })
    }
    const user = verifyToken(token)
    if (!user) {
      return Response.json({ error: 'Session expired' }, { status: 401 })
    }

    const conversations = await getUserConversations(user.userId)
    return Response.json({ conversations })
  } catch (error: any) {
    console.error('Conversations list error:', error)
    return Response.json({ error: 'Failed to load conversations' }, { status: 500 })
  }
}
