import { useState, useMemo } from 'react'

export interface Column<T> {
  key: keyof T & string
  header: string
  editable?: boolean
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

/** Define quais campos geram chips de filtro rápido */
export interface ChipFilterDef {
  key: string
  label: string
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  onUpdate?: (index: number, key: keyof T & string, value: string) => void
  onDelete?: (index: number) => void
  /** Campos usados no filtro de texto livre */
  filterKeys?: (keyof T & string)[]
  /** Campos que geram chips de seleção (filtro multi-campo) */
  chipFilters?: ChipFilterDef[]
}

type SortDir = 'asc' | 'desc'

function SortIcon({ dir, active }: { dir: SortDir | null; active: boolean }) {
  if (!active) return <span className="text-navy-600 ml-1">⇅</span>
  return <span className="text-gold-400 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

export function DataTable<T>({
  data, columns, onUpdate, onDelete, filterKeys, chipFilters = [],
}: Props<T>) {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editCell, setEditCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  // activeChips: { [fieldKey]: Set<value> }
  const [activeChips, setActiveChips] = useState<Record<string, Set<string>>>({})

  // ── Unique values para cada campo de chip ──────────────────────────────────
  const chipOptions = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const cf of chipFilters) {
      const vals = [...new Set(
        data
          .map(row => String((row as Record<string, unknown>)[cf.key] ?? '').trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b))
      result[cf.key] = vals
    }
    return result
  }, [data, chipFilters])

  function toggleChip(key: string, value: string) {
    setActiveChips(prev => {
      const next = { ...prev }
      const current = new Set(next[key] ?? [])
      if (current.has(value)) current.delete(value)
      else current.add(value)
      if (current.size === 0) delete next[key]
      else next[key] = current
      return next
    })
  }

  function clearChips() {
    setActiveChips({})
    setFilter('')
  }

  const hasActiveFilters = filter.trim() || Object.keys(activeChips).length > 0

  // ── Filtrar + Ordenar ──────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let rows = [...data]

    // Texto livre
    if (filter.trim()) {
      const q = filter.toLowerCase()
      rows = rows.filter(row =>
        (filterKeys ?? columns.map(c => c.key)).some(k =>
          String((row as Record<string, unknown>)[k] ?? '').toLowerCase().includes(q)
        )
      )
    }

    // Chips (AND entre campos, OR dentro do mesmo campo)
    for (const [key, values] of Object.entries(activeChips)) {
      if (values.size === 0) continue
      rows = rows.filter(row =>
        values.has(String((row as Record<string, unknown>)[key] ?? '').trim())
      )
    }

    // Ordenação
    if (sortKey) {
      rows.sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? '')
        const bv = String((b as Record<string, unknown>)[sortKey] ?? '')
        const numA = parseFloat(av)
        const numB = parseFloat(bv)
        const cmp = !isNaN(numA) && !isNaN(numB)
          ? numA - numB
          : av.localeCompare(bv, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return rows
  }, [data, filter, activeChips, sortKey, sortDir, filterKeys, columns])

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function startEdit(rowIdx: number, col: string, current: string) {
    setEditCell({ row: rowIdx, col })
    setEditValue(current)
  }

  function commitEdit(originalIdx: number) {
    if (editCell && onUpdate) onUpdate(originalIdx, editCell.col as keyof T & string, editValue)
    setEditCell(null)
  }

  const originalIndex = (row: T) => data.indexOf(row)

  return (
    <div className="flex flex-col gap-3">
      {/* ── Barra de busca + limpar ──────────────────────────────────────── */}
      <div className="flex gap-2 items-center">
        <input
          type="search"
          placeholder="Filtrar por título, artista..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 bg-navy-800 text-white rounded-lg px-3 py-2 text-sm border border-navy-600 focus:outline-none focus:border-gold-400"
        />
        {hasActiveFilters && (
          <button
            onClick={clearChips}
            className="text-xs text-zinc-500 hover:text-red-400 whitespace-nowrap px-2 py-1 border border-navy-700 rounded-lg"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Chips de filtro rápido ────────────────────────────────────────── */}
      {chipFilters.map(cf => {
        const options = chipOptions[cf.key] ?? []
        if (options.length === 0) return null
        const selected = activeChips[cf.key] ?? new Set()
        return (
          <div key={cf.key}>
            <p className="text-xs text-zinc-500 mb-1.5">{cf.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleChip(cf.key, opt)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors border ${
                    selected.has(opt)
                      ? 'bg-gold-400 text-navy-950 border-gold-400 font-semibold'
                      : 'bg-navy-800 text-zinc-400 border-navy-600 hover:border-gold-500 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-navy-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-navy-800 text-zinc-400 uppercase text-xs">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2 select-none ${col.width ?? ''} ${col.sortable ? 'cursor-pointer hover:text-gold-400' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  {col.header}
                  {col.sortable && <SortIcon dir={sortDir} active={sortKey === col.key} />}
                </th>
              ))}
              {onDelete && <th className="px-3 py-2 w-10" />}
            </tr>
          </thead>
          <tbody>
            {processed.map((row, pi) => {
              const oi = originalIndex(row)
              return (
                <tr key={pi} className="border-t border-navy-800 hover:bg-navy-800/50">
                  {columns.map(col => {
                    const val = (row as Record<string, unknown>)[col.key]
                    const isEditing = editCell?.row === oi && editCell?.col === col.key
                    return (
                      <td key={col.key} className="px-3 py-1.5">
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
                              className="bg-navy-700 text-white rounded px-2 py-0.5 w-full text-sm border border-gold-400"
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-gold-400 text-zinc-200"
                              onClick={() => startEdit(oi, col.key, String(val ?? ''))}
                            >
                              {String(val ?? '') || <span className="text-navy-600">—</span>}
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
                      <button onClick={() => onDelete(oi)} className="text-navy-600 hover:text-red-400 text-lg leading-none">×</button>
                    </td>
                  )}
                </tr>
              )
            })}
            {processed.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onDelete ? 1 : 0)} className="px-3 py-8 text-center text-zinc-600">
                  Nenhum resultado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">{processed.length} / {data.length} músicas</p>
    </div>
  )
}
