// lib/pdf/report.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#64748b' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  card: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: '#f8fafc', border: '1 solid #e2e8f0' },
  cardLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 'bold' },
  table: { borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '6 8', borderBottom: '1 solid #e2e8f0' },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '1 solid #f1f5f9' },
  tableRowAlt: { flexDirection: 'row', padding: '5 8', borderBottom: '1 solid #f1f5f9', backgroundColor: '#fafafa' },
  colDate: { width: '12%', color: '#64748b' },
  colDesc: { width: '35%' },
  colCat: { width: '23%', color: '#64748b' },
  colType: { width: '15%' },
  colValue: { width: '15%', textAlign: 'right' },
  colHeaderText: { fontSize: 8, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
  balance: { color: '#4f46e5' },
})

function fmt(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface CategoryData {
  categoryName: string
  total: number
}

interface TransactionData {
  date: string
  description: string
  categoryName: string
  type: 'income' | 'expense'
  amount: number
}

interface Props {
  monthLabel: string
  income: number
  expense: number
  balance: number
  byCategory: CategoryData[]
  transactions: TransactionData[]
}

export default function PdfReport({ monthLabel, income, expense, balance, byCategory, transactions }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Financeiro</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Mês</Text>
          <View style={styles.cards}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Receitas</Text>
              <Text style={[styles.cardValue, styles.income]}>{fmt(income)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Despesas</Text>
              <Text style={[styles.cardValue, styles.expense]}>{fmt(expense)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Saldo</Text>
              <Text style={[styles.cardValue, balance >= 0 ? styles.balance : styles.expense]}>{fmt(balance)}</Text>
            </View>
          </View>
        </View>

        {/* By category */}
        {byCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDesc, styles.colHeaderText]}>Categoria</Text>
                <Text style={[styles.colValue, styles.colHeaderText]}>Total</Text>
                <Text style={[{ width: '15%', textAlign: 'right' as const }, styles.colHeaderText]}>% Despesas</Text>
              </View>
              {byCategory.map((c, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colDesc}>{c.categoryName}</Text>
                  <Text style={[styles.colValue, styles.expense]}>{fmt(c.total)}</Text>
                  <Text style={{ width: '15%', textAlign: 'right' as const, color: '#64748b' }}>
                    {expense > 0 ? `${((c.total / expense) * 100).toFixed(1)}%` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lançamentos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDate, styles.colHeaderText]}>Data</Text>
              <Text style={[styles.colDesc, styles.colHeaderText]}>Descrição</Text>
              <Text style={[styles.colCat, styles.colHeaderText]}>Categoria</Text>
              <Text style={[styles.colType, styles.colHeaderText]}>Tipo</Text>
              <Text style={[styles.colValue, styles.colHeaderText]}>Valor</Text>
            </View>
            {transactions.map((tx, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.colDate}>
                  {new Date(`${tx.date}T12:00:00`).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={styles.colDesc}>{tx.description}</Text>
                <Text style={styles.colCat}>{tx.categoryName}</Text>
                <Text style={[styles.colType, tx.type === 'income' ? styles.income : styles.expense]}>
                  {tx.type === 'income' ? 'Receita' : 'Despesa'}
                </Text>
                <Text style={[styles.colValue, tx.type === 'income' ? styles.income : styles.expense]}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}
