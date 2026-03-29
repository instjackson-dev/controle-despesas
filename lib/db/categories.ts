// lib/db/categories.ts
import { db } from './index'
import { categories } from './schema'
import { eq, and } from 'drizzle-orm'

export function getCategories(userId: number) {
  return db.select().from(categories).where(eq(categories.userId, userId)).all()
}

export function createCategory(data: {
  userId: number
  name: string
  type: 'income' | 'expense'
  color: string
}) {
  return db.insert(categories).values(data).returning().get()
}

export function updateCategory(
  id: number,
  userId: number,
  data: Partial<{ name: string; type: 'income' | 'expense'; color: string }>
) {
  return db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning()
    .get()
}

export function deleteCategory(id: number, userId: number) {
  return db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .run()
}
