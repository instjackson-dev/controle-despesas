// app/(protected)/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'
import SummaryCards from '@/components/dashboard/SummaryCards'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = Number(session.user.id)
  const month = new Date().toISOString().slice(0, 7)
  const data = getDashboardData(userId, month)

  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{monthLabel}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumo do mês atual</p>
        </div>
        <Link
          href="/api/export/pdf"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          target="_blank"
        >
          📄 Exportar PDF
        </Link>
      </div>

      <SummaryCards income={data.income} expense={data.expense} balance={data.balance} />
      <CategoryBarChart data={data.byCategory} />
    </div>
  )
}
