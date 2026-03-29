// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateCategory, deleteCategory } from '@/lib/db/categories'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const updated = updateCategory(Number(params.id), Number(session.user.id), body)
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const categoryId = Number(params.id)
  const userId = Number(session.user.id)

  const linked = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.categoryId, categoryId), eq(transactions.userId, userId)))
    .get()

  if (linked) {
    return NextResponse.json(
      { error: 'Categoria possui transações vinculadas. Remova as transações primeiro.' },
      { status: 409 }
    )
  }

  deleteCategory(categoryId, userId)
  return NextResponse.json({ ok: true })
}
