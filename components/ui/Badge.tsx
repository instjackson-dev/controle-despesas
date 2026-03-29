// components/ui/Badge.tsx
const styles = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
}

const labels = {
  income: 'Receita',
  expense: 'Despesa',
}

export default function Badge({ type }: { type: 'income' | 'expense' }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}
