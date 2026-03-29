// scripts/seed.ts
import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import bcrypt from 'bcryptjs'

async function seed() {
  const username = process.env.SEED_USERNAME
  const password = process.env.SEED_PASSWORD

  if (!username || !password) {
    throw new Error('SEED_USERNAME and SEED_PASSWORD environment variables are required.\nCreate a .env.local file based on .env.example and set them.')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  db.insert(users).values({ username, passwordHash }).onConflictDoNothing().run()
  console.log(`✅ Usuário criado: ${username}`)
}

seed().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
