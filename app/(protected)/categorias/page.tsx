// app/(protected)/categorias/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories } from '@/lib/db/categories'
import CategoryList from '@/components/categories/CategoryList'
import { redirect } from 'next/navigation'

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const categories = getCategories(Number(session.user.id))
  return (
    <div className="p-6">
      <CategoryList initialCategories={categories} />
    </div>
  )
}
