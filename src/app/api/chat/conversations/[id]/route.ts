// src/app/api/chat/conversations/[id]/route.ts
// DELETE /api/chat/conversations/[id] — Delete a specific conversation

import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { deleteConversation } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ---- AUTH CHECK ----
    const token = request.cookies.get('suryamitra_token')?.value
    if (!token) {
      return Response.json({ error: 'Please login again' }, { status: 401 })
    }
    const user = verifyToken(token)
    if (!user) {
      return Response.json({ error: 'Session expired' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return Response.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // ---- DELETE CONVERSATION ----
    // The DB helper ensures only the owner can delete
    await deleteConversation(id, user.userId)

    return Response.json({ success: true, message: 'Conversation deleted' })

  } catch (error: any) {
    console.error('[Delete-Conv] Error:', error)
    return Response.json({ 
      error: error?.message || 'Failed to delete conversation' 
    }, { status: 500 })
  }
}
