// scripts/seed.ts
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

async function seed() {
  const username = process.env.SEED_USERNAME
  const password = process.env.SEED_PASSWORD

  if (!username || !password) {
    throw new Error(
      'SEED_USERNAME and SEED_PASSWORD environment variables are required.'
    )
  }

  const dbPath =
    process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'app.db')

  console.log(`📂 DB path: ${dbPath}`)

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = OFF')

  console.log('🔨 Creating tables...')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  console.log('✅ Tables ready')

  const passwordHash = await bcrypt.hash(password, 10)
  sqlite
    .prepare(
      'INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)'
    )
    .run(username, passwordHash)

  console.log(`✅ Usuário criado: ${username}`)
  sqlite.close()
}

seed().catch((err) => {
  console.error('❌ Seed error:', err.message)
  console.error(err.stack)
  process.exit(1)
})
