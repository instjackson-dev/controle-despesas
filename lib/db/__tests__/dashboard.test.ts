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
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash) VALUES ('test', 'hash');
    INSERT INTO categories (user_id, name, type, color) VALUES (1, 'Alimentação', 'expense', '#e91e63');
    INSERT INTO categories (user_id, name, type, color) VALUES (1, 'Salário', 'income', '#4caf50');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 2, 5000.0, 'Salário Março', '2026-03-01', 'income');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 1, 1200.0, 'Supermercado', '2026-03-05', 'expense');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 1, 300.0, 'Restaurante', '2026-03-10', 'expense');
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import { getDashboardData } from '@/lib/db/dashboard'

describe('getDashboardData', () => {
  const userId = 1
  const month = '2026-03'

  it('returns correct income total', () => {
    const data = getDashboardData(userId, month)
    expect(data.income).toBe(5000)
  })

  it('returns correct expense total', () => {
    const data = getDashboardData(userId, month)
    expect(data.expense).toBe(1500)
  })

  it('returns correct balance', () => {
    const data = getDashboardData(userId, month)
    expect(data.balance).toBe(3500)
  })

  it('returns expenses grouped by category', () => {
    const data = getDashboardData(userId, month)
    expect(data.byCategory).toHaveLength(1)
    expect(data.byCategory[0].categoryName).toBe('Alimentação')
    expect(data.byCategory[0].total).toBe(1500)
  })

  it('returns zero totals for empty month', () => {
    const data = getDashboardData(userId, '2025-01')
    expect(data.income).toBe(0)
    expect(data.expense).toBe(0)
    expect(data.balance).toBe(0)
    expect(data.byCategory).toHaveLength(0)
  })
})
