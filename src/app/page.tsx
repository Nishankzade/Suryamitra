// src/app/page.tsx — Landing page / redirect
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default function Home() {
  const token = cookies().get('suryamitra_token')?.value
  if (token) {
    const user = verifyToken(token)
    if (user) redirect('/dashboard')
  }
  redirect('/login')
}
