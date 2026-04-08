import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SetlistItem } from '../../types'
import { useSetlistStore } from '../../store/useSetlistStore'

interface Props { item: SetlistItem }

export function PauseItem({ item }: Props) {
  const { updateItem, removeItem } = useSetlistStore()
  const id = `${item.blockIndex}-${item.itemIndex}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl"
    >
      <button
        {...attributes} {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none"
      >⣿</button>

      <span className="text-zinc-600 flex-none">⏸</span>

      <input
        type="text"
        value={item.pauseLabel}
        onChange={e => updateItem(item.blockIndex, item.itemIndex, { pauseLabel: e.target.value })}
        className="flex-1 bg-transparent text-zinc-400 text-sm outline-none"
        placeholder="Pausa"
      />

      <button
        onClick={() => removeItem(item.blockIndex, item.itemIndex)}
        className="text-zinc-700 hover:text-red-500 text-lg leading-none"
      >×</button>
    </div>
  )
}
