// app/api/dashboard/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const month = new Date().toISOString().slice(0, 7)
  const data = getDashboardData(Number(session.user.id), month)
  return NextResponse.json({ ...data, month })
}
