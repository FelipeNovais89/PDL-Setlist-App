import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Block, SetlistItem } from '../../types'
import { useSetlistStore } from '../../store/useSetlistStore'
import { SongItem } from './SongItem'
import { PauseItem } from './PauseItem'
import { SongPickerModal } from './SongPickerModal'
import type { Song } from '../../types'

interface Props {
  block: Block
  onPreview?: (item: SetlistItem) => void
}

export function BlockCard({ block, onPreview }: Props) {
  const { renameBlock, removeBlock, addSong, addPause, moveItem } = useSetlistStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(block.blockName)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromItemIndex = parseInt(String(active.id).split('-')[1])
    const toItemIndex   = parseInt(String(over.id).split('-')[1])
    moveItem(block.blockIndex, fromItemIndex, toItemIndex)
  }

  function handleSelectSong(song: Song) {
    addSong(block.blockIndex, {
      songTitle:           song.titulo,
      artist:              song.artista,
      tom:                 song.tomOriginal,
      bpm:                 song.bpm,
      cifraDriveId:        song.cifraDriveId,
      cifraSimplificadaId: song.cifraSimplificadaId,
    })
  }

  const itemIds = block.items.map(i => `${i.blockIndex}-${i.itemIndex}`)

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Header do bloco */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={() => { renameBlock(block.blockIndex, nameValue); setEditingName(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { renameBlock(block.blockIndex, nameValue); setEditingName(false) } }}
            className="bg-zinc-700 text-white rounded px-2 py-0.5 text-sm font-semibold w-40"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-white font-semibold text-sm hover:text-amber-400"
          >
            {block.blockName} <span className="text-zinc-600 text-xs">({block.items.length})</span>
          </button>
        )}
        <button
          onClick={() => removeBlock(block.blockIndex)}
          className="text-zinc-600 hover:text-red-400 text-sm"
        >Remover bloco</button>
      </div>

      {/* Itens */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="p-3 space-y-2">
            {block.items.map(item =>
              item.itemType === 'pause'
                ? <PauseItem key={`${item.blockIndex}-${item.itemIndex}`} item={item} />
                : <SongItem key={`${item.blockIndex}-${item.itemIndex}`} item={item} onPreview={onPreview} />
            )}
            {block.items.length === 0 && (
              <p className="text-center text-zinc-700 text-sm py-3">Bloco vazio</p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Footer: adicionar */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >+ Música</button>
        <button
          onClick={() => addPause(block.blockIndex)}
          className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 text-sm transition-colors"
        >+ Pausa</button>
      </div>

      <SongPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectSong}
      />
    </div>
  )
}
