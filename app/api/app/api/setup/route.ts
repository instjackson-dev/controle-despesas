import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')

  const username = process.env.SEED_USERNAME
  const password = process.env.SEED_PASSWORD
  const setupKey = process.env.SETUP_KEY

  if (!username || !password || !setupKey) {
    return NextResponse.json({ error: 'Faltam variáveis obrigatórias.' }, { status: 500 })
  }

  if (key !== setupKey) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    db.insert(users).values({ username, passwordHash }).run()
    return NextResponse.json({ ok: true, created: username })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: 'Usuário já existe ou houve erro.', detail: String(e?.message || e) },
      { status: 200 }
    )
  }
}
