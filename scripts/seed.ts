// scripts/seed.ts
import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import bcrypt from 'bcryptjs'

async function seed() {
  const username = process.env.SEED_USERNAME ?? 'admin'
  const password = process.env.SEED_PASSWORD ?? 'senha123'
  const passwordHash = await bcrypt.hash(password, 10)
  db.insert(users).values({ username, passwordHash }).onConflictDoNothing().run()
  console.log(`✅ Usuário criado: ${username}`)
  console.log(`   Senha: ${password}`)
}

seed().catch(console.error)
