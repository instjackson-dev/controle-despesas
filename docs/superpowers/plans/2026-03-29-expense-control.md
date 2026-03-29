# Controle de Despesas Pessoais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um app web de controle financeiro pessoal com categorias personalizáveis de receitas/despesas, dashboard mensal, gráfico de barras por categoria, e exportação PDF.

**Architecture:** Next.js 14 App Router com SQLite via Drizzle ORM. Route Handlers lidam com todas as operações de dados server-side. Páginas usam server components para buscar dados e client components para UI interativa.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Drizzle ORM, better-sqlite3, NextAuth.js v4, Recharts, @react-pdf/renderer, bcryptjs, Jest + ts-jest

---

## Mapa de Arquivos

```
controle-despesas/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (auth)/login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        ← dashboard
│   │   ├── transacoes/page.tsx
│   │   └── categorias/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── dashboard/route.ts
│       ├── transactions/route.ts
│       ├── transactions/[id]/route.ts
│       ├── categories/route.ts
│       ├── categories/[id]/route.ts
│       └── export/pdf/route.ts
├── components/
│   ├── providers/index.tsx
│   ├── layout/Sidebar.tsx
│   ├── ui/Modal.tsx
│   ├── ui/Badge.tsx
│   ├── ui/Button.tsx
│   ├── dashboard/SummaryCards.tsx
│   ├── dashboard/CategoryBarChart.tsx
│   ├── transactions/TransactionTable.tsx
│   ├── transactions/TransactionModal.tsx
│   ├── categories/CategoryList.tsx
│   └── categories/CategoryModal.tsx
├── lib/
│   ├── auth.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   ├── categories.ts
│   │   ├── transactions.ts
│   │   ├── dashboard.ts
│   │   └── __tests__/
│   │       ├── categories.test.ts
│   │       ├── transactions.test.ts
│   │       └── dashboard.test.ts
│   └── pdf/report.tsx
├── scripts/seed.ts
├── types/next-auth.d.ts
├── drizzle/                                ← auto-gerado
├── data/                                   ← app.db (gitignored)
├── drizzle.config.ts
├── jest.config.ts
├── middleware.ts
├── .env.local
└── .env.example
```

---

## Task 1: Scaffold do projeto Next.js + dependências + Jest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `jest.config.ts`

- [ ] **Step 1: Criar o projeto Next.js**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --eslint --import-alias "@/*"
```

Se perguntar sobre a pasta existente, confirme com `y`. Responda `Yes` para todas as opções se houver prompts.

- [ ] **Step 2: Instalar dependências de produção**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
npm install drizzle-orm better-sqlite3 next-auth bcryptjs recharts @react-pdf/renderer
```

- [ ] **Step 3: Instalar dependências de dev**

```bash
npm install --save-dev drizzle-kit @types/better-sqlite3 @types/bcryptjs jest @types/jest ts-jest ts-node
```

- [ ] **Step 4: Configurar next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', '@react-pdf/renderer'],
}

export default nextConfig
```

- [ ] **Step 5: Criar jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 6: Adicionar scripts no package.json**

Abra `package.json` e adicione dentro de `"scripts"`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"seed": "ts-node --project tsconfig.json -e \"require('ts-node/register'); require('./scripts/seed.ts')\""
```

- [ ] **Step 7: Verificar que o projeto roda**

```bash
npm run dev
```

Esperado: servidor rodando em `http://localhost:3000`

Pare o servidor com `Ctrl+C`.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
git add -A
git commit -m "chore: scaffold Next.js 14 project with dependencies"
```

---

## Task 2: Schema do banco de dados + conexão + migration

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`, `data/.gitkeep`

- [ ] **Step 1: Criar diretório data/**

```bash
mkdir -p /c/Users/Administrator/Documents/controle-despesas/data
touch /c/Users/Administrator/Documents/controle-despesas/data/.gitkeep
```

- [ ] **Step 2: Criar lib/db/schema.ts**

```typescript
// lib/db/schema.ts
import { int, text, real, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: int('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const categories = sqliteTable('categories', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const transactions = sqliteTable('transactions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().references(() => users.id),
  categoryId: int('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})
```

- [ ] **Step 3: Criar lib/db/index.ts**

```typescript
// lib/db/index.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'app.db')

if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { sqlite }
```

- [ ] **Step 4: Criar drizzle.config.ts**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/app.db',
  },
} satisfies Config
```

- [ ] **Step 5: Gerar e aplicar a migration**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
npm run db:generate
npm run db:migrate
```

Esperado: pasta `drizzle/` criada com arquivo SQL de migration. Arquivo `data/app.db` criado.

- [ ] **Step 6: Verificar que as tabelas foram criadas**

```bash
npx ts-node -e "
const db = require('./lib/db').db;
const schema = require('./lib/db/schema');
console.log('Tables OK');
"
```

Esperado: `Tables OK` sem erros.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add database schema with users, categories, transactions"
```

---

## Task 3: Autenticação + middleware + página de login + seed

**Files:**
- Create: `lib/auth.ts`, `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `app/(auth)/login/page.tsx`, `scripts/seed.ts`, `.env.local`, `.env.example`

- [ ] **Step 1: Criar .env.local**

```bash
# .env.local
NEXTAUTH_SECRET=mude-este-segredo-em-producao-$(openssl rand -hex 32)
NEXTAUTH_URL=http://localhost:3000
SEED_USERNAME=admin
SEED_PASSWORD=senha123
```

Execute para gerar:
```bash
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')
NEXTAUTH_URL=http://localhost:3000
SEED_USERNAME=admin
SEED_PASSWORD=senha123" > /c/Users/Administrator/Documents/controle-despesas/.env.local
```

- [ ] **Step 2: Criar .env.example**

```bash
# .env.example
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
SEED_USERNAME=admin
SEED_PASSWORD=sua-senha-aqui
```

Salve como `.env.example`.

- [ ] **Step 3: Criar types/next-auth.d.ts**

```typescript
// types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
    }
  }
  interface User {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
```

- [ ] **Step 4: Criar lib/auth.ts**

```typescript
// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = db.select().from(users).where(eq(users.username, credentials.username)).get()
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: String(user.id), name: user.username }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      return session
    },
  },
}
```

- [ ] **Step 5: Criar app/api/auth/[...nextauth]/route.ts**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 6: Criar middleware.ts**

```typescript
// middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
}
```

- [ ] **Step 7: Criar scripts/seed.ts**

```typescript
// scripts/seed.ts
import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import bcrypt from 'bcryptjs'

async function seed() {
  const username = process.env.SEED_USERNAME ?? 'admin'
  const password = process.env.SEED_PASSWORD ?? 'senha123'
  const passwordHash = await bcrypt.hash(password, 10)
  db.insert(users).values({ username, passwordHash }).onConflictDoNothing().run()
  console.log(`✅ Usuário criado: ${username}`)
  console.log(`   Senha: ${password}`)
}

seed().catch(console.error)
```

- [ ] **Step 8: Criar app/(auth)/login/page.tsx**

```tsx
// app/(auth)/login/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
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
    if (result?.error) {
      setError('Usuário ou senha inválidos.')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">💰 Controle Financeiro</h1>
        <p className="text-slate-500 text-sm mb-6">Faça login para continuar</p>

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
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Executar seed para criar usuário**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed.ts
```

Esperado:
```
✅ Usuário criado: admin
   Senha: senha123
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add NextAuth authentication, login page, and seed script"
```

---

## Task 4: Root layout + providers + layout protegido + sidebar

**Files:**
- Create: `components/providers/index.tsx`, `app/layout.tsx`, `app/globals.css`, `components/layout/Sidebar.tsx`, `app/(protected)/layout.tsx`

- [ ] **Step 1: Criar components/providers/index.tsx**

```tsx
// components/providers/index.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 2: Atualizar app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle Financeiro',
  description: 'Controle de despesas pessoais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Criar components/layout/Sidebar.tsx**

```tsx
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

export default function Sidebar({ username }: { username: string }) {
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
```

- [ ] **Step 4: Criar app/(protected)/layout.tsx**

```tsx
// app/(protected)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar username={session.user.name ?? ''} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Verificar que o login funciona**

```bash
npm run dev
```

Abra `http://localhost:3000`. Deve redirecionar para `/login`. Faça login com `admin` / `senha123`. Deve redirecionar para `/` (ainda sem conteúdo real).

Pare com `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add layout with sidebar navigation and session provider"
```

---

## Task 5: Componentes UI compartilhados

**Files:**
- Create: `components/ui/Modal.tsx`, `components/ui/Badge.tsx`, `components/ui/Button.tsx`

- [ ] **Step 1: Criar components/ui/Modal.tsx**

```tsx
// components/ui/Modal.tsx
'use client'

import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar components/ui/Badge.tsx**

```tsx
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
```

- [ ] **Step 3: Criar components/ui/Button.tsx**

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost'
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shared UI components (Modal, Badge, Button)"
```

---

## Task 6: Categories — camada de banco de dados com testes

**Files:**
- Create: `lib/db/categories.ts`, `lib/db/__tests__/categories.test.ts`

- [ ] **Step 1: Criar o teste primeiro**

```typescript
// lib/db/__tests__/categories.test.ts
import { eq } from 'drizzle-orm'

jest.mock('@/lib/db', () => {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const schema = require('@/lib/db/schema')

  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash) VALUES ('test', 'hash');
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/db/categories'

describe('categories', () => {
  const userId = 1

  it('getCategories returns empty array initially', () => {
    const result = getCategories(userId)
    expect(result).toEqual([])
  })

  it('createCategory inserts and returns the category', () => {
    const cat = createCategory({ userId, name: 'Alimentação', type: 'expense', color: '#e91e63' })
    expect(cat).toMatchObject({ name: 'Alimentação', type: 'expense', color: '#e91e63', userId })
    expect(cat?.id).toBeDefined()
  })

  it('getCategories returns created categories', () => {
    const cats = getCategories(userId)
    expect(cats.length).toBeGreaterThan(0)
    expect(cats[0].name).toBe('Alimentação')
  })

  it('updateCategory changes the name', () => {
    const cats = getCategories(userId)
    const updated = updateCategory(cats[0].id, userId, { name: 'Mercado' })
    expect(updated?.name).toBe('Mercado')
  })

  it('deleteCategory removes the category', () => {
    const cats = getCategories(userId)
    deleteCategory(cats[0].id, userId)
    const after = getCategories(userId)
    expect(after.length).toBe(0)
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest lib/db/__tests__/categories.test.ts --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/db/categories'`

- [ ] **Step 3: Criar lib/db/categories.ts**

```typescript
// lib/db/categories.ts
import { db } from './index'
import { categories } from './schema'
import { eq, and } from 'drizzle-orm'

export function getCategories(userId: number) {
  return db.select().from(categories).where(eq(categories.userId, userId)).all()
}

export function createCategory(data: {
  userId: number
  name: string
  type: 'income' | 'expense'
  color: string
}) {
  return db.insert(categories).values(data).returning().get()
}

export function updateCategory(
  id: number,
  userId: number,
  data: Partial<{ name: string; type: 'income' | 'expense'; color: string }>
) {
  return db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning()
    .get()
}

export function deleteCategory(id: number, userId: number) {
  return db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .run()
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
npx jest lib/db/__tests__/categories.test.ts --no-coverage
```

Esperado: PASS — 5 testes passando

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add categories DB layer with tests"
```

---

## Task 7: Categories — API routes

**Files:**
- Create: `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts`

- [ ] **Step 1: Criar app/api/categories/route.ts**

```typescript
// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories, createCategory } from '@/lib/db/categories'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const data = getCategories(Number(session.user.id))
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, type, color } = body

  if (!name || !type || !color) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, type, color' }, { status: 400 })
  }

  const category = createCategory({ userId: Number(session.user.id), name, type, color })
  return NextResponse.json(category, { status: 201 })
}
```

- [ ] **Step 2: Criar app/api/categories/[id]/route.ts**

```typescript
// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateCategory, deleteCategory } from '@/lib/db/categories'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const updated = updateCategory(Number(params.id), Number(session.user.id), body)
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const categoryId = Number(params.id)
  const userId = Number(session.user.id)

  const linked = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.categoryId, categoryId), eq(transactions.userId, userId)))
    .get()

  if (linked) {
    return NextResponse.json(
      { error: 'Categoria possui transações vinculadas. Remova as transações primeiro.' },
      { status: 409 }
    )
  }

  deleteCategory(categoryId, userId)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Testar as rotas manualmente**

```bash
npm run dev
```

Em outro terminal:
```bash
# Login e pegar cookie não é trivial via curl — testar via browser em http://localhost:3000
```

Acesse `http://localhost:3000/categorias` após login. Não haverá erro 500.

Pare o servidor com `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add categories API routes (GET, POST, PUT, DELETE)"
```

---

## Task 8: Categories — página de UI

**Files:**
- Create: `components/categories/CategoryModal.tsx`, `components/categories/CategoryList.tsx`, `app/(protected)/categorias/page.tsx`

- [ ] **Step 1: Criar components/categories/CategoryModal.tsx**

```tsx
// components/categories/CategoryModal.tsx
'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
}

interface Props {
  initial?: Category
  onClose: () => void
  onSaved: () => void
}

export default function CategoryModal({ initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense')
  const [color, setColor] = useState(initial?.color ?? '#6366f1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = initial ? `/api/categories/${initial.id}` : '/api/categories'
    const method = initial ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, color }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar')
      return
    }
    onSaved()
  }

  return (
    <Modal title={initial ? 'Editar Categoria' : 'Nova Categoria'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
            />
            <span className="text-sm text-slate-500">{color}</span>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Criar components/categories/CategoryList.tsx**

```tsx
// components/categories/CategoryList.tsx
'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import CategoryModal from './CategoryModal'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
}

interface Props {
  initialCategories: Category[]
}

export default function CategoryList({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [deleteError, setDeleteError] = useState('')

  async function refresh() {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  async function handleDelete(id: number) {
    setDeleteError('')
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error)
      return
    }
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function openNew() {
    setEditing(undefined)
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Categorias</h1>
        <Button onClick={openNew}>+ Nova Categoria</Button>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {deleteError}
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                <Badge type={cat.type} />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => openEdit(cat)}>✏️</Button>
                <Button variant="ghost" onClick={() => handleDelete(cat.id)}>🗑️</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          initial={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Criar app/(protected)/categorias/page.tsx**

```tsx
// app/(protected)/categorias/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories } from '@/lib/db/categories'
import CategoryList from '@/components/categories/CategoryList'

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions)
  const categories = getCategories(Number(session!.user.id))
  return (
    <div className="p-6">
      <CategoryList initialCategories={categories} />
    </div>
  )
}
```

- [ ] **Step 4: Testar a página de categorias**

```bash
npm run dev
```

Acesse `http://localhost:3000/categorias`. Crie algumas categorias (ex: "Alimentação" despesa, "Salário" receita). Edite e exclua. Verifique que funciona.

Pare com `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add categories page with CRUD UI"
```

---

## Task 9: Transactions — camada de banco de dados com testes

**Files:**
- Create: `lib/db/transactions.ts`, `lib/db/__tests__/transactions.test.ts`

- [ ] **Step 1: Criar o teste primeiro**

```typescript
// lib/db/__tests__/transactions.test.ts
jest.mock('@/lib/db', () => {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const schema = require('@/lib/db/schema')

  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash) VALUES ('test', 'hash');
    INSERT INTO categories (user_id, name, type, color) VALUES (1, 'Alimentação', 'expense', '#e91e63');
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/db/transactions'

const userId = 1
const categoryId = 1
const month = '2026-03'

describe('transactions', () => {
  it('getTransactions returns empty array initially', () => {
    const result = getTransactions(userId, month)
    expect(result).toEqual([])
  })

  it('createTransaction inserts and returns the transaction', () => {
    const tx = createTransaction({
      userId,
      categoryId,
      amount: 450.0,
      description: 'Supermercado',
      date: '2026-03-05',
      type: 'expense',
    })
    expect(tx).toMatchObject({ description: 'Supermercado', amount: 450.0, type: 'expense' })
    expect(tx?.id).toBeDefined()
  })

  it('getTransactions returns transactions for current month', () => {
    const txs = getTransactions(userId, month)
    expect(txs.length).toBe(1)
    expect(txs[0].description).toBe('Supermercado')
    expect(txs[0].categoryName).toBe('Alimentação')
  })

  it('getTransactions ignores other months', () => {
    const txs = getTransactions(userId, '2026-02')
    expect(txs).toEqual([])
  })

  it('updateTransaction changes the amount', () => {
    const txs = getTransactions(userId, month)
    const updated = updateTransaction(txs[0].id, userId, { amount: 500 })
    expect(updated?.amount).toBe(500)
  })

  it('deleteTransaction removes the transaction', () => {
    const txs = getTransactions(userId, month)
    deleteTransaction(txs[0].id, userId)
    expect(getTransactions(userId, month)).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest lib/db/__tests__/transactions.test.ts --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/db/transactions'`

- [ ] **Step 3: Criar lib/db/transactions.ts**

```typescript
// lib/db/transactions.ts
import { db } from './index'
import { transactions, categories } from './schema'
import { eq, and, like } from 'drizzle-orm'

export function getTransactions(userId: number, month: string) {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      type: transactions.type,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), like(transactions.date, `${month}%`)))
    .orderBy(transactions.date)
    .all()
}

export function createTransaction(data: {
  userId: number
  categoryId: number
  amount: number
  description: string
  date: string
  type: 'income' | 'expense'
}) {
  return db.insert(transactions).values(data).returning().get()
}

export function updateTransaction(
  id: number,
  userId: number,
  data: Partial<{
    categoryId: number
    amount: number
    description: string
    date: string
    type: 'income' | 'expense'
  }>
) {
  return db
    .update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning()
    .get()
}

export function deleteTransaction(id: number, userId: number) {
  return db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .run()
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
npx jest lib/db/__tests__/transactions.test.ts --no-coverage
```

Esperado: PASS — 6 testes passando

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add transactions DB layer with tests"
```

---

## Task 10: Transactions — API routes

**Files:**
- Create: `app/api/transactions/route.ts`, `app/api/transactions/[id]/route.ts`

- [ ] **Step 1: Criar app/api/transactions/route.ts**

```typescript
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTransactions, createTransaction } from '@/lib/db/transactions'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') ?? currentMonth()
  const data = getTransactions(Number(session.user.id), month)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { categoryId, amount, description, date, type } = body

  if (!categoryId || !amount || !description || !date || !type) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }

  const tx = createTransaction({
    userId: Number(session.user.id),
    categoryId: Number(categoryId),
    amount: Number(amount),
    description,
    date,
    type,
  })
  return NextResponse.json(tx, { status: 201 })
}
```

- [ ] **Step 2: Criar app/api/transactions/[id]/route.ts**

```typescript
// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateTransaction, deleteTransaction } from '@/lib/db/transactions'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  if (body.categoryId) body.categoryId = Number(body.categoryId)
  if (body.amount) body.amount = Number(body.amount)

  const updated = updateTransaction(Number(params.id), Number(session.user.id), body)
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  deleteTransaction(Number(params.id), Number(session.user.id))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add transactions API routes (GET, POST, PUT, DELETE)"
```

---

## Task 11: Transactions — página de UI

**Files:**
- Create: `components/transactions/TransactionModal.tsx`, `components/transactions/TransactionTable.tsx`, `app/(protected)/transacoes/page.tsx`

- [ ] **Step 1: Criar components/transactions/TransactionModal.tsx**

```tsx
// components/transactions/TransactionModal.tsx
'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
}

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  type: 'income' | 'expense'
  categoryId: number
}

interface Props {
  categories: Category[]
  initial?: Transaction
  onClose: () => void
  onSaved: () => void
}

export default function TransactionModal({ categories, initial, onClose, onSaved }: Props) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState(initial?.categoryId?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = categories.filter((c) => c.type === type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = initial ? `/api/transactions/${initial.id}` : '/api/transactions'
    const method = initial ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount: Number(amount), date, type, categoryId: Number(categoryId) }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar')
      return
    }
    onSaved()
  }

  return (
    <Modal title={initial ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as 'income' | 'expense'); setCategoryId('') }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {filteredCategories.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Nenhuma categoria de {type === 'expense' ? 'despesa' : 'receita'} cadastrada.
            </p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Criar components/transactions/TransactionTable.tsx**

```tsx
// components/transactions/TransactionTable.tsx
'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import TransactionModal from './TransactionModal'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
}

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  type: 'income' | 'expense'
  categoryId: number
  categoryName: string
  categoryColor: string
}

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
  month: string
}

export default function TransactionTable({ initialTransactions, categories, month }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | undefined>()

  async function refresh() {
    const res = await fetch(`/api/transactions?month=${month}`)
    const data = await res.json()
    setTransactions(data)
  }

  async function handleDelete(id: number) {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCategory !== 'all' && t.categoryId.toString() !== filterCategory) return false
    return true
  })

  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-slate-800 capitalize">
          Transações — {monthLabel}
        </h1>
        <Button onClick={() => { setEditing(undefined); setShowModal(true) }}>
          + Novo Lançamento
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhuma transação encontrada.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(`${tx.date}T12:00:00`).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tx.categoryColor }}
                      />
                      {tx.categoryName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge type={tx.type} />
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}
                    {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" onClick={() => { setEditing(tx); setShowModal(true) }}>✏️</Button>
                      <Button variant="ghost" onClick={() => handleDelete(tx.id)}>🗑️</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TransactionModal
          categories={categories}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Criar app/(protected)/transacoes/page.tsx**

```tsx
// app/(protected)/transacoes/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTransactions } from '@/lib/db/transactions'
import { getCategories } from '@/lib/db/categories'
import TransactionTable from '@/components/transactions/TransactionTable'

export default async function TransacoesPage() {
  const session = await getServerSession(authOptions)
  const userId = Number(session!.user.id)
  const month = new Date().toISOString().slice(0, 7)

  const [transactions, categories] = [
    getTransactions(userId, month),
    getCategories(userId),
  ]

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
```

- [ ] **Step 4: Testar a página de transações**

```bash
npm run dev
```

Acesse `http://localhost:3000/transacoes`. Crie algumas transações. Filtre por tipo e categoria. Edite e exclua. Verifique que funciona.

Pare com `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add transactions page with table, filters, and CRUD modal"
```

---

## Task 12: Dashboard — camada de banco de dados com testes

**Files:**
- Create: `lib/db/dashboard.ts`, `lib/db/__tests__/dashboard.test.ts`

- [ ] **Step 1: Criar o teste primeiro**

```typescript
// lib/db/__tests__/dashboard.test.ts
jest.mock('@/lib/db', () => {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const schema = require('@/lib/db/schema')

  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash) VALUES ('test', 'hash');
    INSERT INTO categories (user_id, name, type, color) VALUES (1, 'Alimentação', 'expense', '#e91e63');
    INSERT INTO categories (user_id, name, type, color) VALUES (1, 'Salário', 'income', '#4caf50');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 2, 5000.0, 'Salário Março', '2026-03-01', 'income');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 1, 1200.0, 'Supermercado', '2026-03-05', 'expense');
    INSERT INTO transactions (user_id, category_id, amount, description, date, type)
      VALUES (1, 1, 300.0, 'Restaurante', '2026-03-10', 'expense');
  `)

  const db = drizzle(sqlite, { schema })
  return { db }
})

import { getDashboardData } from '@/lib/db/dashboard'

describe('getDashboardData', () => {
  const userId = 1
  const month = '2026-03'

  it('returns correct income total', () => {
    const data = getDashboardData(userId, month)
    expect(data.income).toBe(5000)
  })

  it('returns correct expense total', () => {
    const data = getDashboardData(userId, month)
    expect(data.expense).toBe(1500)
  })

  it('returns correct balance', () => {
    const data = getDashboardData(userId, month)
    expect(data.balance).toBe(3500)
  })

  it('returns expenses grouped by category', () => {
    const data = getDashboardData(userId, month)
    expect(data.byCategory).toHaveLength(1)
    expect(data.byCategory[0].categoryName).toBe('Alimentação')
    expect(data.byCategory[0].total).toBe(1500)
  })

  it('returns zero totals for empty month', () => {
    const data = getDashboardData(userId, '2025-01')
    expect(data.income).toBe(0)
    expect(data.expense).toBe(0)
    expect(data.balance).toBe(0)
    expect(data.byCategory).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest lib/db/__tests__/dashboard.test.ts --no-coverage
```

Esperado: FAIL — `Cannot find module '@/lib/db/dashboard'`

- [ ] **Step 3: Criar lib/db/dashboard.ts**

```typescript
// lib/db/dashboard.ts
import { db } from './index'
import { transactions, categories } from './schema'
import { eq, and, like, sql } from 'drizzle-orm'

export function getDashboardData(userId: number, month: string) {
  const totals = db
    .select({
      type: transactions.type,
      total: sql<number>`COALESCE(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), like(transactions.date, `${month}%`)))
    .groupBy(transactions.type)
    .all()

  const byCategory = db
    .select({
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<number>`COALESCE(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        like(transactions.date, `${month}%`)
      )
    )
    .groupBy(transactions.categoryId)
    .orderBy(sql`sum(${transactions.amount}) DESC`)
    .all()

  const income = totals.find((t) => t.type === 'income')?.total ?? 0
  const expense = totals.find((t) => t.type === 'expense')?.total ?? 0

  return { income, expense, balance: income - expense, byCategory }
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
npx jest lib/db/__tests__/dashboard.test.ts --no-coverage
```

Esperado: PASS — 5 testes passando

- [ ] **Step 5: Rodar todos os testes**

```bash
npx jest --no-coverage
```

Esperado: PASS — todos os 16 testes passando

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dashboard DB layer with tests"
```

---

## Task 13: Dashboard — API route + página

**Files:**
- Create: `app/api/dashboard/route.ts`, `components/dashboard/SummaryCards.tsx`, `components/dashboard/CategoryBarChart.tsx`, `app/(protected)/page.tsx`

- [ ] **Step 1: Criar app/api/dashboard/route.ts**

```typescript
// app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const month = new Date().toISOString().slice(0, 7)
  const data = getDashboardData(Number(session.user.id), month)
  return NextResponse.json({ ...data, month })
}
```

- [ ] **Step 2: Criar components/dashboard/SummaryCards.tsx**

```tsx
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
```

- [ ] **Step 3: Criar components/dashboard/CategoryBarChart.tsx**

```tsx
// components/dashboard/CategoryBarChart.tsx
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface CategoryData {
  categoryName: string
  categoryColor: string
  total: number
}

interface Props {
  data: CategoryData[]
}

export default function CategoryBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Gastos por Categoria
        </h2>
        <p className="text-slate-400 text-sm">Nenhuma despesa lançada neste mês.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Gastos por Categoria
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="categoryName" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(v) =>
              v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
            }
          />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.categoryColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Criar app/(protected)/page.tsx (dashboard)**

```tsx
// app/(protected)/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'
import SummaryCards from '@/components/dashboard/SummaryCards'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = Number(session!.user.id)
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
```

- [ ] **Step 5: Testar o dashboard**

```bash
npm run dev
```

Acesse `http://localhost:3000`. Verifique que os cards mostram totais corretos e o gráfico exibe as categorias de despesa. Se não houver dados, adicione alguns em `/transacoes` primeiro.

Pare com `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with summary cards and category bar chart"
```

---

## Task 14: Export PDF

**Files:**
- Create: `lib/pdf/report.tsx`, `app/api/export/pdf/route.ts`

- [ ] **Step 1: Criar lib/pdf/report.tsx**

```tsx
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
  colDesc: { width: '35%', fontWeight: 'bold' },
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
                <Text style={[{ width: '15%', textAlign: 'right' }, styles.colHeaderText]}>% Despesas</Text>
              </View>
              {byCategory.map((c, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colDesc}>{c.categoryName}</Text>
                  <Text style={[styles.colValue, styles.expense]}>{fmt(c.total)}</Text>
                  <Text style={{ width: '15%', textAlign: 'right', color: '#64748b' }}>
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
```

- [ ] **Step 2: Criar app/api/export/pdf/route.ts**

```typescript
// app/api/export/pdf/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/db/dashboard'
import { getTransactions } from '@/lib/db/transactions'
import { renderToBuffer } from '@react-pdf/renderer'
import PdfReport from '@/lib/pdf/report'
import React from 'react'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = Number(session.user.id)
  const month = new Date().toISOString().slice(0, 7)

  const [dashData, transactions] = [
    getDashboardData(userId, month),
    getTransactions(userId, month),
  ]

  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const buffer = await renderToBuffer(
    React.createElement(PdfReport, {
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      income: dashData.income,
      expense: dashData.expense,
      balance: dashData.balance,
      byCategory: dashData.byCategory,
      transactions,
    })
  )

  const filename = `relatorio-${month}.pdf`
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 3: Testar o export PDF**

```bash
npm run dev
```

Acesse `http://localhost:3000`. Clique em **📄 Exportar PDF**. O PDF deve ser baixado com resumo, tabela de categorias e lista de transações.

Pare com `Ctrl+C`.

- [ ] **Step 4: Adicionar .gitignore para data/ e .env.local**

Verifique que `.gitignore` contém as seguintes linhas (o create-next-app normalmente já inclui):
```
.env.local
data/
*.db
```

Adicione se necessário:
```bash
echo "data/
*.db" >> /c/Users/Administrator/Documents/controle-despesas/.gitignore
```

- [ ] **Step 5: Commit final**

```bash
cd /c/Users/Administrator/Documents/controle-despesas
git add -A
git commit -m "feat: add PDF export with monthly report (summary + transactions)"
```

---

## Resumo Final

Após todos os tasks, o app estará completo com:

- Login com usuário/senha (NextAuth.js)
- Dashboard com cards de resumo e gráfico de barras por categoria
- Página de transações com tabela, filtros e CRUD via modal
- Página de categorias totalmente personalizável (nome, tipo, cor)
- Export PDF com resumo mensal e lista detalhada de transações
- 16 testes unitários cobrindo toda a camada de banco de dados

**Para iniciar o desenvolvimento:**
```bash
cd /c/Users/Administrator/Documents/controle-despesas
npm run dev
# Acesse http://localhost:3000
# Login: admin / senha123
```
