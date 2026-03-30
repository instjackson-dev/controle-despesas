// app/api/register/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const existing = db.select().from(users).where(eq(users.username, username)).get()
  if (existing) {
    return NextResponse.json({ error: 'Nome de usuário já está em uso.' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  db.insert(users).values({ username, passwordHash, status: 'pendente' }).run()

  return NextResponse.json({ ok: true })
}
