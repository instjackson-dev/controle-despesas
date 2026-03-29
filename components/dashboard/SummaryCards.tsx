// components/dashboard/SummaryCards.tsx
interface Props {
  income: number
  expense: number
  balance: number
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SummaryCards({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Receitas</p>
        <p className="text-2xl font-bold text-green-600">{fmt(income)}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Despesas</p>
        <p className="text-2xl font-bold text-red-500">{fmt(expense)}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Saldo</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
          {fmt(balance)}
        </p>
      </div>
    </div>
  )
}
