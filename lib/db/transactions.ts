// lib/db/transactions.ts
import { db } from './index'
import { transactions, categories } from './schema'
import { eq, and, like } from 'drizzle-orm'

export function getTransactions(userId: number, month: string) {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      type: transactions.type,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), like(transactions.date, `${month}%`)))
    .orderBy(transactions.date)
    .all()
}

export function createTransaction(data: {
  userId: number
  categoryId: number
  amount: number
  description: string
  date: string
  type: 'income' | 'expense'
}) {
  return db.insert(transactions).values(data).returning().get()
}

export function updateTransaction(
  id: number,
  userId: number,
  data: Partial<{
    categoryId: number
    amount: number
    description: string
    date: string
    type: 'income' | 'expense'
  }>
) {
  return db
    .update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning()
    .get()
}

export function deleteTransaction(id: number, userId: number) {
  return db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .run()
}
