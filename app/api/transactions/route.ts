// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTransactions, createTransaction } from '@/lib/db/transactions'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') ?? currentMonth()
  const data = getTransactions(Number(session.user.id), month)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { categoryId, amount, description, date, type } = body

  if (!categoryId || !amount || !description || !date || !type) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }

  const tx = createTransaction({
    userId: Number(session.user.id),
    categoryId: Number(categoryId),
    amount: Number(amount),
    description,
    date,
    type,
  })
  return NextResponse.json(tx, { status: 201 })
}
