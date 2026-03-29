# Controle de Despesas Pessoais — Design Spec

**Data:** 2026-03-29
**Status:** Aprovado

---

## Visão Geral

Aplicativo web de controle financeiro pessoal com cadastro de receitas e despesas por categoria, dashboard mensal, gráfico de gastos por categoria e exportação de relatório em PDF. Desenvolvido em Next.js 14 com SQLite local, interface em português do Brasil.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Banco de dados | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM |
| Autenticação | NextAuth.js (provider de credenciais) |
| Gráficos | Recharts |
| Export PDF | `@react-pdf/renderer` |
| Estilização | Tailwind CSS |
| Linguagem | TypeScript |

---

## Banco de Dados

### Tabela `users`
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
username     TEXT NOT NULL UNIQUE
password_hash TEXT NOT NULL
created_at   TEXT NOT NULL DEFAULT (datetime('now'))
```

### Tabela `categories`
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
user_id    INTEGER NOT NULL REFERENCES users(id)
name       TEXT NOT NULL
type       TEXT NOT NULL CHECK(type IN ('income', 'expense'))
color      TEXT NOT NULL  -- hex, ex: #e91e63
created_at TEXT NOT NULL DEFAULT (datetime('now'))
```

### Tabela `transactions`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
user_id     INTEGER NOT NULL REFERENCES users(id)
category_id INTEGER NOT NULL REFERENCES categories(id)
amount      REAL NOT NULL
description TEXT NOT NULL
date        TEXT NOT NULL  -- YYYY-MM-DD
type        TEXT NOT NULL CHECK(type IN ('income', 'expense'))
created_at  TEXT NOT NULL DEFAULT (datetime('now'))
```

---

## Autenticação

- NextAuth.js com `CredentialsProvider`
- Sessão via JWT armazenado em cookie httpOnly
- Um único usuário cadastrado via script de seed (sem tela de registro pública)
- Todas as rotas exceto `/login` são protegidas via middleware do NextAuth
- Senha armazenada com hash `bcrypt`

---

## Páginas e Rotas

### `/login`
- Formulário com campos usuário e senha
- Redirecionamento para `/` após login bem-sucedido
- Exibe erro em caso de credenciais inválidas

### `/` — Dashboard
- **Layout:** Sidebar escura fixa à esquerda + área de conteúdo à direita
- **Cabeçalho do conteúdo:** mês atual (ex: "Março 2026")
- **3 cards de resumo:** Receitas (verde) / Despesas (vermelho) / Saldo (azul)
- **Gráfico de barras verticais** (Recharts): valor por categoria de despesa no mês
- **Botão "Exportar PDF"** — gera e faz download do relatório completo do mês

### `/transacoes` — Transações
- Tabela com colunas: Data, Descrição, Categoria, Tipo, Valor, Ações
- Filtros: tipo (Receita/Despesa/Todos) e categoria
- Botão "+ Novo Lançamento" abre modal com formulário
- Modal de edição/exclusão ao clicar no ícone de ação
- Exibe somente transações do mês atual

### `/categorias` — Categorias
- Lista de categorias com nome, tipo (badge colorido) e cor (preview)
- Botão "+ Nova Categoria" abre modal com formulário
- Edição e exclusão inline por categoria
- Impede exclusão de categoria com transações vinculadas (exibe aviso)

---

## Route Handlers (API)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard` | Totais do mês + dados para gráfico |
| GET | `/api/transactions` | Lista transações do mês (com filtros) |
| POST | `/api/transactions` | Cria nova transação |
| PUT | `/api/transactions/[id]` | Atualiza transação |
| DELETE | `/api/transactions/[id]` | Remove transação |
| GET | `/api/categories` | Lista categorias do usuário |
| POST | `/api/categories` | Cria categoria |
| PUT | `/api/categories/[id]` | Atualiza categoria |
| DELETE | `/api/categories/[id]` | Remove categoria |
| GET | `/api/export/pdf` | Gera e retorna PDF do mês |

---

## Export PDF

Conteúdo do relatório mensal:
1. Cabeçalho com título e mês de referência
2. Cards de resumo: Receitas totais, Despesas totais, Saldo
3. Tabela de gastos por categoria (nome, total, % do total de despesas)
4. Tabela detalhada de todas as transações do mês (data, descrição, categoria, valor)

Gerado server-side via `@react-pdf/renderer` no Route Handler `/api/export/pdf`.

---

## Layout e Estrutura de Componentes

```
app/
  (auth)/
    login/page.tsx
  (protected)/
    layout.tsx          ← sidebar + proteção de rota
    page.tsx            ← dashboard
    transacoes/page.tsx
    categorias/page.tsx
  api/
    auth/[...nextauth]/route.ts
    dashboard/route.ts
    transactions/route.ts
    transactions/[id]/route.ts
    categories/route.ts
    categories/[id]/route.ts
    export/pdf/route.ts

components/
  layout/
    Sidebar.tsx
  dashboard/
    SummaryCards.tsx
    CategoryBarChart.tsx
  transactions/
    TransactionTable.tsx
    TransactionModal.tsx
  categories/
    CategoryList.tsx
    CategoryModal.tsx
  ui/
    Modal.tsx
    Badge.tsx
    Button.tsx

lib/
  db/
    schema.ts           ← schema Drizzle
    index.ts            ← conexão SQLite
  auth.ts               ← configuração NextAuth
  pdf/
    report.tsx          ← template PDF

scripts/
  seed.ts               ← cria usuário inicial
```

---

## Restrições e Decisões

- **Usuário único:** sem cadastro público, usuário criado via `npm run seed` — credenciais definidas nas variáveis de ambiente `SEED_USERNAME` e `SEED_PASSWORD`
- **Período fixo:** dashboard e listagem sempre exibem o mês atual (sem filtro de período)
- **Sem categorias padrão:** usuário cria todas as categorias do zero
- **SQLite local:** banco de dados armazenado em `data/app.db` na raiz do projeto
- **Idioma:** toda a interface em português do Brasil
