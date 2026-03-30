// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.name !== process.env.SEED_USERNAME) return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const all = db.select({
    id: users.id,
    username: users.username,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users).all()
  return NextResponse.json(all)
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const { id, status } = await req.json()
  if (!['ativo', 'pendente', 'bloqueado'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  db.update(users).set({ status }).where(eq(users.id, id)).run()
  return NextResponse.json({ ok: true })
}
