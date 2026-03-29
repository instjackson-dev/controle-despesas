// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateTransaction, deleteTransaction } from '@/lib/db/transactions'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  if (body.categoryId) body.categoryId = Number(body.categoryId)
  if (body.amount) body.amount = Number(body.amount)

  const updated = updateTransaction(Number(params.id), Number(session.user.id), body)
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  deleteTransaction(Number(params.id), Number(session.user.id))
  return NextResponse.json({ ok: true })
}
