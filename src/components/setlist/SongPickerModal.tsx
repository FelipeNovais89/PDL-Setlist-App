import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useSongsStore } from '../../store/useSongsStore'
import type { Song } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (song: Song) => void
}

export function SongPickerModal({ open, onClose, onSelect }: Props) {
  const { songs } = useSongsStore()
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? songs.filter(s =>
        s.titulo.toLowerCase().includes(filter.toLowerCase()) ||
        s.artista.toLowerCase().includes(filter.toLowerCase())
      )
    : songs

  return (
    <Modal open={open} onClose={onClose} title="Escolher Música">
      <div className="space-y-3">
        <input
          type="search"
          placeholder="Filtrar por título ou artista..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          autoFocus
          className="w-full bg-navy-800 text-white rounded-lg px-3 py-2 text-sm border border-navy-600 focus:outline-none focus:border-gold-400"
        />
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filtered.map((song, i) => (
            <button
              key={i}
              onClick={() => { onSelect(song); onClose() }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <div className="text-sm text-white font-medium truncate">{song.titulo}</div>
              <div className="text-xs text-zinc-400">
                {song.artista}{song.tomOriginal ? ` · ${song.tomOriginal}` : ''}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-zinc-600 py-4 text-sm">Nenhuma música encontrada</p>
          )}
        </div>
        <Button variant="ghost" onClick={onClose} className="w-full justify-center">Cancelar</Button>
      </div>
    </Modal>
  )
}
