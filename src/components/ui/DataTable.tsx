import { useState, type ChangeEvent } from 'react'

export interface Column<T> {
  key: keyof T & string
  header: string
  editable?: boolean
  width?: string
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  onUpdate?: (index: number, key: keyof T & string, value: string) => void
  onDelete?: (index: number) => void
  filterKeys?: (keyof T & string)[]
}

export function DataTable<T>({
  data, columns, onUpdate, onDelete, filterKeys,
}: Props<T>) {
  const [filter, setFilter] = useState('')
  const [editCell, setEditCell] = useState<{ row: number; col: keyof T & string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = filter
    ? data.filter(row =>
        (filterKeys ?? (columns.map(c => c.key))).some(k =>
          String((row as Record<string, unknown>)[k as string] ?? '').toLowerCase().includes(filter.toLowerCase())
        )
      )
    : data

  function startEdit(rowIdx: number, col: keyof T & string, current: string) {
    setEditCell({ row: rowIdx, col })
    setEditValue(current)
  }

  function commitEdit(originalIndex: number) {
    if (editCell && onUpdate) {
      onUpdate(originalIndex, editCell.col, editValue)
    }
    setEditCell(null)
  }

  const originalIndex = (filteredIdx: number) =>
    data.indexOf(filtered[filteredIdx])

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        placeholder="Filtrar..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700 focus:outline-none focus:border-amber-500"
      />
      <div className="overflow-x-auto rounded-xl border border-zinc-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs">
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} className={`px-3 py-2 ${col.width ?? ''}`}>{col.header}</th>
              ))}
              {onDelete && <th className="px-3 py-2 w-10" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, fi) => {
              const oi = originalIndex(fi)
              return (
                <tr key={fi} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                  {columns.map(col => {
                    const val = (row as Record<string, unknown>)[col.key]
                    const isEditing = editCell?.row === oi && editCell?.col === col.key
                    return (
                      <td key={String(col.key)} className="px-3 py-1.5">
                        {col.render ? (
                          col.render(val, row, oi)
                        ) : col.editable && onUpdate ? (
                          isEditing ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(oi)}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(oi) }}
                              className="bg-zinc-700 text-white rounded px-2 py-0.5 w-full text-sm"
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-amber-400 text-zinc-200"
                              onClick={() => startEdit(oi, col.key, String(val ?? ''))}
                            >
                              {String(val ?? '') || <span className="text-zinc-600">—</span>}
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-300">{String(val ?? '')}</span>
                        )}
                      </td>
                    )
                  })}
                  {onDelete && (
                    <td className="px-2 py-1">
                      <button
                        onClick={() => onDelete(oi)}
                        className="text-zinc-600 hover:text-red-400 text-lg leading-none"
                        title="Remover"
                      >×</button>
                    </td>
                  )}
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onDelete ? 1 : 0)} className="px-3 py-6 text-center text-zinc-600">
                  Nenhum resultado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-600">{filtered.length} / {data.length} músicas</p>
    </div>
  )
}
