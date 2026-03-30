// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/transacoes', label: 'Transações', icon: '💸' },
  { href: '/categorias', label: 'Categorias', icon: '🏷️' },
]

export default function Sidebar({ username, isAdmin }: { username: string; isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-slate-800 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-700">
        <span className="text-white font-bold text-lg">💰 Finanças</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {isAdmin && (
        <div className="px-3 pb-2">
          <Link
            href="/admin/usuarios"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              pathname === '/admin/usuarios'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>👥</span> Usuários
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Olá, {username}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs text-slate-400 hover:text-white transition text-left"
        >
          Sair →
        </button>
      </div>
    </aside>
  )
}
