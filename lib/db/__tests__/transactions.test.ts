// lib/db/__tests__/transactions.test.ts
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
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/db/transactions'

const userId = 1
const categoryId = 1
const month = '2026-03'

describe('transactions', () => {
  it('getTransactions returns empty array initially', () => {
    const result = getTransactions(userId, month)
    expect(result).toEqual([])
  })

  it('createTransaction inserts and returns the transaction', () => {
    const tx = createTransaction({
      userId,
      categoryId,
      amount: 450.0,
      description: 'Supermercado',
      date: '2026-03-05',
      type: 'expense',
    })
    expect(tx).toMatchObject({ description: 'Supermercado', amount: 450.0, type: 'expense' })
    expect(tx?.id).toBeDefined()
  })

  it('getTransactions returns transactions for current month', () => {
    const txs = getTransactions(userId, month)
    expect(txs.length).toBe(1)
    expect(txs[0].description).toBe('Supermercado')
    expect(txs[0].categoryName).toBe('Alimentação')
  })

  it('getTransactions ignores other months', () => {
    const txs = getTransactions(userId, '2026-02')
    expect(txs).toEqual([])
  })

  it('updateTransaction changes the amount', () => {
    const txs = getTransactions(userId, month)
    const updated = updateTransaction(txs[0].id, userId, { amount: 500 })
    expect(updated?.amount).toBe(500)
  })

  it('deleteTransaction removes the transaction', () => {
    const txs = getTransactions(userId, month)
    deleteTransaction(txs[0].id, userId)
    expect(getTransactions(userId, month)).toEqual([])
  })
})
