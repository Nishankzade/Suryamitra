// src/app/api/setup/route.ts
// GET /api/setup — creates all DB tables if they don't exist (run once)

import { NextResponse } from 'next/server'
import { setupDatabase } from '@/lib/db'

export async function GET() {
  try {
    await setupDatabase()
    return NextResponse.json({ success: true, message: 'Database tables created successfully!' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
