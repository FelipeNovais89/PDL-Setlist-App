import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SetlistItem } from '../../types'
import { useSetlistStore } from '../../store/useSetlistStore'

interface Props {
  item: SetlistItem
  onPreview?: (item: SetlistItem) => void
}

const TONES = [
  'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
  'Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm',
]

export function SongItem({ item, onPreview }: Props) {
  const { updateItem, removeItem } = useSetlistStore()
  const [expanded, setExpanded] = useState(false)

  const id = `${item.blockIndex}-${item.itemIndex}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function update(patch: Partial<SetlistItem>) {
    updateItem(item.blockIndex, item.itemIndex, patch)
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-navy-900 rounded-xl border border-navy-700 overflow-hidden">
      {/* Row principal */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...attributes} {...listeners}
          className="text-navy-600 hover:text-navy-400 cursor-grab active:cursor-grabbing touch-none flex-none"
        >⣿</button>

        <div className="flex-1 min-w-0" onClick={() => setExpanded(e => !e)}>
          <div className="text-sm text-white font-medium truncate">{item.songTitle || '—'}</div>
          <div className="text-xs text-zinc-400 truncate">
            {item.artist}
            {item.tom && <span className="ml-1 text-blue-400 font-semibold">[{item.tom}]</span>}
            {item.bpm && <span className="ml-1 text-zinc-500">♩{item.bpm}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-none">
          {onPreview && (
            <button onClick={() => onPreview(item)} className="text-zinc-400 hover:text-gold-400 px-1 text-lg" title="Ver cifra">👁</button>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-zinc-400 hover:text-white px-1 text-sm">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => removeItem(item.blockIndex, item.itemIndex)} className="text-navy-600 hover:text-red-400 px-1 text-lg leading-none">×</button>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="border-t border-navy-700 px-3 py-3 space-y-2 bg-navy-950">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-zinc-500">
              Tom
              <select
                value={item.tom}
                onChange={e => update({ tom: e.target.value })}
                className="mt-1 w-full bg-navy-800 text-white rounded px-2 py-1 text-sm border border-navy-600"
              >
                <option value="">—</option>
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              BPM
              <input
                type="number"
                value={item.bpm}
                onChange={e => update({ bpm: e.target.value })}
                className="mt-1 w-full bg-navy-800 text-white rounded px-2 py-1 text-sm border border-navy-600"
                placeholder="—"
              />
            </label>
          </div>

          <label className="block text-xs text-zinc-500">
            OBS
            <input type="text" value={item.obs} onChange={e => update({ obs: e.target.value })}
              className="mt-1 w-full bg-navy-800 text-white rounded px-2 py-1 text-sm border border-navy-600"
              placeholder="Observação..." />
          </label>

          <label className="block text-xs text-zinc-500">
            Preparação
            <input type="text" value={item.preparacao} onChange={e => update({ preparacao: e.target.value })}
              className="mt-1 w-full bg-navy-800 text-white rounded px-2 py-1 text-sm border border-navy-600"
              placeholder="Preparação..." />
          </label>

          <label className="block text-xs text-zinc-500">
            Drive ID (cifra)
            <input type="text" value={item.cifraDriveId} onChange={e => update({ cifraDriveId: e.target.value })}
              className="mt-1 w-full bg-navy-800 text-white rounded px-2 py-1 text-xs border border-navy-600 font-mono"
              placeholder="ID do Google Drive..." />
          </label>

          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input type="checkbox" checked={item.useSimplificada}
              onChange={e => update({ useSimplificada: e.target.checked })}
              className="accent-gold-400" />
            Usar cifra simplificada
          </label>
        </div>
      )}
    </div>
  )
}
