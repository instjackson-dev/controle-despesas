// app/(auth)/login/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PendenteMsg() {
  const searchParams = useSearchParams()
  if (searchParams.get('msg') !== 'pendente') return null
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-3 py-2 mb-4">
      Conta criada! Aguarde a aprovação do administrador.
    </div>
  )
}

function LoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    setLoading(false)
    if (!result?.ok || result?.error) {
      setError('Usuário ou senha inválidos.')
    } else {
      window.location.href = '/'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
        <input
          name="username"
          type="text"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
        <input
          name="password"
          type="password"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 text-sm transition disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">💰 Controle Financeiro</h1>
        <p className="text-slate-500 text-sm mb-6">Faça login para continuar</p>

        <Suspense>
          <PendenteMsg />
        </Suspense>

        <LoginForm />

        <p className="text-center text-sm text-slate-500 mt-4">
          Não tem conta?{' '}
          <Link href="/registro" className="text-indigo-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
