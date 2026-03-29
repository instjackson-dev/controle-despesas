import { db } from './index'
import { transactions, categories } from './schema'
import { eq, and, like, sql } from 'drizzle-orm'

export function getDashboardData(userId: number, month: string) {
  const totals = db
    .select({
      type: transactions.type,
      total: sql<number>`COALESCE(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), like(transactions.date, `${month}%`)))
    .groupBy(transactions.type)
    .all()

  const byCategory = db
    .select({
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<number>`COALESCE(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        like(transactions.date, `${month}%`)
      )
    )
    .groupBy(transactions.categoryId)
    .orderBy(sql`sum(${transactions.amount}) DESC`)
    .all()

  const income = totals.find((t) => t.type === 'income')?.total ?? 0
  const expense = totals.find((t) => t.type === 'expense')?.total ?? 0

  return { income, expense, balance: income - expense, byCategory }
}
