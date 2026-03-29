// lib/db/__tests__/categories.test.ts
import { eq } from 'drizzle-orm'

jest.mock('@/lib/db', () => {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const schema = require('@/lib/db/schema')

  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash) VALUES ('test', 'hash');
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/db/categories'

describe('categories', () => {
  const userId = 1

  it('getCategories returns empty array initially', () => {
    const result = getCategories(userId)
    expect(result).toEqual([])
  })

  it('createCategory inserts and returns the category', () => {
    const cat = createCategory({ userId, name: 'Alimentação', type: 'expense', color: '#e91e63' })
    expect(cat).toMatchObject({ name: 'Alimentação', type: 'expense', color: '#e91e63', userId })
    expect(cat?.id).toBeDefined()
  })

  it('getCategories returns created categories', () => {
    const cats = getCategories(userId)
    expect(cats.length).toBeGreaterThan(0)
    expect(cats[0].name).toBe('Alimentação')
  })

  it('updateCategory changes the name', () => {
    const cats = getCategories(userId)
    const updated = updateCategory(cats[0].id, userId, { name: 'Mercado' })
    expect(updated?.name).toBe('Mercado')
  })

  it('deleteCategory removes the category', () => {
    const cats = getCategories(userId)
    deleteCategory(cats[0].id, userId)
    const after = getCategories(userId)
    expect(after.length).toBe(0)
  })
})
