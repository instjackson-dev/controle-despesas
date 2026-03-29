// lib/db/schema.ts
import { int, text, real, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: int('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const categories = sqliteTable('categories', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const transactions = sqliteTable('transactions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().references(() => users.id),
  categoryId: int('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})
