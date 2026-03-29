// app/api/export/pdf/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'
import { getTransactions } from '@/lib/db/transactions'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import PdfReport from '@/lib/pdf/report'
import React, { JSXElementConstructor, ReactElement } from 'react'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = Number(session.user.id)
  const month = new Date().toISOString().slice(0, 7)

  const dashData = getDashboardData(userId, month)
  const transactions = getTransactions(userId, month)

  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const element = React.createElement(PdfReport, {
    monthLabel: capitalizedLabel,
    income: dashData.income,
    expense: dashData.expense,
    balance: dashData.balance,
    byCategory: dashData.byCategory,
    transactions,
  }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const buffer = await renderToBuffer(element)

  const filename = `relatorio-${month}.pdf`
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
