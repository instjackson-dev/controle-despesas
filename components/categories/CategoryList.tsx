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
