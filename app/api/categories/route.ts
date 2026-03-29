// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories, createCategory } from '@/lib/db/categories'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const data = getCategories(Number(session.user.id))
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, type, color } = body

  if (!name || !type || !color) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, type, color' }, { status: 400 })
  }

  const category = createCategory({ userId: Number(session.user.id), name, type, color })
  return NextResponse.json(category, { status: 201 })
}
