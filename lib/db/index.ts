// lib/db/index.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

function createDb() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const dbPath = isBuild
    ? ':memory:'
    : (process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'app.db'))

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('pendente', 'ativo', 'bloqueado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  // migration: add status column to existing databases
  const cols = sqlite.prepare(`PRAGMA table_info(users)`).all() as { name: string }[]
  if (!cols.find(c => c.name === 'status')) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('pendente', 'ativo', 'bloqueado'))`)
  }
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

  return drizzle(sqlite, { schema })
}

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDb> | undefined
}

export const db = globalThis.__db ?? (globalThis.__db = createDb())
