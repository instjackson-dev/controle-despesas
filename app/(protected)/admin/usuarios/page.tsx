// app/(protected)/admin/usuarios/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  username: string
  status: 'pendente' | 'ativo' | 'bloqueado'
  createdAt: string
}

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  bloqueado: 'Bloqueado',
}

const statusColor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  ativo: 'bg-green-100 text-green-800',
  bloqueado: 'bg-red-100 text-red-800',
}

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const adminUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.name !== adminUser) {
      router.push('/')
      return
    }
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
  }, [session, status, router, adminUser])

  async function updateStatus(id: number, newStatus: string) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus as User['status'] } : u))
  }

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gerenciar Usuários</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Usuário</th>
              <th className="text-left px-4 py-3 font-medium">Cadastro</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[user.status]}`}>
                    {statusLabel[user.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.status !== 'ativo' && (
                      <button
                        onClick={() => updateStatus(user.id, 'ativo')}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        Aprovar
                      </button>
                    )}
                    {user.status !== 'bloqueado' && (
                      <button
                        onClick={() => updateStatus(user.id, 'bloqueado')}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Bloquear
                      </button>
                    )}
                    {user.status === 'bloqueado' && (
                      <button
                        onClick={() => updateStatus(user.id, 'pendente')}
                        className="text-xs bg-slate-400 hover:bg-slate-500 text-white px-3 py-1 rounded-lg"
                      >
                        Resetar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
