// app/(protected)/transacoes/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTransactions } from '@/lib/db/transactions'
import { getCategories } from '@/lib/db/categories'
import TransactionTable from '@/components/transactions/TransactionTable'
import { redirect } from 'next/navigation'

export default async function TransacoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = Number(session.user.id)
  const month = new Date().toISOString().slice(0, 7)

  const transactions = getTransactions(userId, month)
  const categories = getCategories(userId)

  return (
    <div className="p-6">
      <TransactionTable
        initialTransactions={transactions}
        categories={categories}
        month={month}
      />
    </div>
  )
}
