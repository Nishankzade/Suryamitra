// src/app/api/chat/messages/[conversationId]/route.ts
// GET /api/chat/messages/:conversationId — Returns all messages for a conversation

import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getConversationForUser, getConversationMessages } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: { conversationId: string } }
) {
    try {
        const token = request.cookies.get('suryamitra_token')?.value
        if (!token) {
            return Response.json({ error: 'Please login again' }, { status: 401 })
        }
        const user = verifyToken(token)
        if (!user) {
            return Response.json({ error: 'Session expired' }, { status: 401 })
        }

        const conversation = await getConversationForUser(params.conversationId, user.userId)
        if (!conversation) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const messages = await getConversationMessages(params.conversationId)
        return Response.json({ messages })
    } catch (error: any) {
        console.error('Load messages error:', error)
        return Response.json({ error: 'Failed to load messages' }, { status: 500 })
    }
}
