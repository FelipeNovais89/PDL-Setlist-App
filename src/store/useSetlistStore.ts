/**
 * Estado global da setlist ativa.
 * Mantém itens em lista plana (igual ao CSV) e expõe helpers para:
 * - agrupar em blocos
 * - adicionar / remover / mover itens
 * - editar campos de um item
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SetlistItem, Block, ItemType } from '../types'

interface SetlistState {
  items: SetlistItem[]
  filename: string
  isDirty: boolean

  // Actions
  loadItems: (items: SetlistItem[], filename: string) => void
  clearSetlist: () => void
  setFilename: (name: string) => void

  addBlock: () => void
  renameBlock: (blockIndex: number, name: string) => void
  removeBlock: (blockIndex: number) => void

  addSong: (blockIndex: number, song: Partial<SetlistItem>) => void
  addPause: (blockIndex: number, label?: string) => void
  removeItem: (blockIndex: number, itemIndex: number) => void
  updateItem: (blockIndex: number, itemIndex: number, patch: Partial<SetlistItem>) => void

  moveItem: (blockIndex: number, fromItemIndex: number, toItemIndex: number) => void
  moveItemToBlock: (fromBlock: number, itemIndex: number, toBlock: number) => void

  // Selectors
  blocks: () => Block[]
  flatItems: () => SetlistItem[]
  musicItems: () => SetlistItem[]
}

function nextItemIndex(items: SetlistItem[], blockIndex: number): number {
  const existing = items.filter(i => i.blockIndex === blockIndex)
  return existing.length > 0 ? Math.max(...existing.map(i => i.itemIndex)) + 1 : 1
}

function nextBlockIndex(items: SetlistItem[]): number {
  return items.length > 0 ? Math.max(...items.map(i => i.blockIndex)) + 1 : 1
}

function reindex(items: SetlistItem[]): SetlistItem[] {
  // Re-numera itemIndex dentro de cada bloco mantendo a ordem
  const byBlock = new Map<number, SetlistItem[]>()
  for (const it of items) {
    if (!byBlock.has(it.blockIndex)) byBlock.set(it.blockIndex, [])
    byBlock.get(it.blockIndex)!.push(it)
  }
  const result: SetlistItem[] = []
  const sortedBlocks = [...byBlock.keys()].sort((a, b) => a - b)
  for (const bi of sortedBlocks) {
    const blockItems = byBlock.get(bi)!
    blockItems.forEach((it, idx) => {
      result.push({ ...it, itemIndex: idx + 1 })
    })
  }
  return result
}

export const useSetlistStore = create<SetlistState>()(
  persist(
    (set, get) => ({
      items: [],
      filename: 'nova_setlist.csv',
      isDirty: false,

      loadItems: (items, filename) => set({ items, filename, isDirty: false }),
      clearSetlist: () => set({ items: [], filename: 'nova_setlist.csv', isDirty: false }),
      setFilename: (name) => set({ filename: name }),

      addBlock: () => {
        const items = get().items
        const bi = nextBlockIndex(items)
        set({ items: [...items, {
          blockIndex: bi,
          blockName: `Bloco ${bi}`,
          itemIndex: 0,
          itemType: 'music',
          songTitle: '', artist: '', tom: '', bpm: '',
          cifraDriveId: '', cifraSimplificadaId: '',
          useSimplificada: false, pauseLabel: '', obs: '', preparacao: '',
        }], isDirty: true })
        // Remove o placeholder imediatamente — era só para reservar o índice
        set(s => ({ items: s.items.filter(i => !(i.blockIndex === bi && i.itemIndex === 0)) }))
      },

      renameBlock: (blockIndex, name) => {
        set(s => ({
          items: s.items.map(i => i.blockIndex === blockIndex ? { ...i, blockName: name } : i),
          isDirty: true,
        }))
      },

      removeBlock: (blockIndex) => {
        set(s => ({
          items: s.items.filter(i => i.blockIndex !== blockIndex),
          isDirty: true,
        }))
      },

      addSong: (blockIndex, song) => {
        const items = get().items
        const itemIndex = nextItemIndex(items, blockIndex)
        const blockName = items.find(i => i.blockIndex === blockIndex)?.blockName ?? `Bloco ${blockIndex}`
        const newItem: SetlistItem = {
          blockIndex, blockName, itemIndex,
          itemType: 'music',
          songTitle: '', artist: '', tom: '', bpm: '',
          cifraDriveId: '', cifraSimplificadaId: '',
          useSimplificada: false, pauseLabel: '', obs: '', preparacao: '',
          ...song,
        }
        set({ items: [...items, newItem], isDirty: true })
      },

      addPause: (blockIndex, label = 'Pausa') => {
        const items = get().items
        const itemIndex = nextItemIndex(items, blockIndex)
        const blockName = items.find(i => i.blockIndex === blockIndex)?.blockName ?? `Bloco ${blockIndex}`
        set({
          items: [...items, {
            blockIndex, blockName, itemIndex,
            itemType: 'pause',
            songTitle: '', artist: '', tom: '', bpm: '',
            cifraDriveId: '', cifraSimplificadaId: '',
            useSimplificada: false, pauseLabel: label, obs: '', preparacao: '',
          }],
          isDirty: true,
        })
      },

      removeItem: (blockIndex, itemIndex) => {
        set(s => ({
          items: reindex(s.items.filter(i => !(i.blockIndex === blockIndex && i.itemIndex === itemIndex))),
          isDirty: true,
        }))
      },

      updateItem: (blockIndex, itemIndex, patch) => {
        set(s => ({
          items: s.items.map(i =>
            i.blockIndex === blockIndex && i.itemIndex === itemIndex
              ? { ...i, ...patch }
              : i
          ),
          isDirty: true,
        }))
      },

      moveItem: (blockIndex, fromItemIndex, toItemIndex) => {
        const items = [...get().items]
        const blockItems = items.filter(i => i.blockIndex === blockIndex)
        const others    = items.filter(i => i.blockIndex !== blockIndex)

        const fromPos = blockItems.findIndex(i => i.itemIndex === fromItemIndex)
        const toPos   = blockItems.findIndex(i => i.itemIndex === toItemIndex)
        if (fromPos < 0 || toPos < 0) return

        const [moved] = blockItems.splice(fromPos, 1)
        blockItems.splice(toPos, 0, moved)

        const reindexed = blockItems.map((it, idx) => ({ ...it, itemIndex: idx + 1 }))
        set({ items: [...others, ...reindexed], isDirty: true })
      },

      moveItemToBlock: (fromBlock, itemIndex, toBlock) => {
        const items = get().items
        const item = items.find(i => i.blockIndex === fromBlock && i.itemIndex === itemIndex)
        if (!item) return
        const blockName = items.find(i => i.blockIndex === toBlock)?.blockName ?? `Bloco ${toBlock}`
        const newItemIndex = nextItemIndex(items.filter(i => i.blockIndex !== fromBlock || i.itemIndex !== itemIndex), toBlock)
        const filtered = items.filter(i => !(i.blockIndex === fromBlock && i.itemIndex === itemIndex))
        set({
          items: reindex([...filtered, { ...item, blockIndex: toBlock, blockName, itemIndex: newItemIndex }]),
          isDirty: true,
        })
      },

      blocks: () => {
        const items = get().items
        const map = new Map<number, Block>()
        for (const it of items) {
          if (!map.has(it.blockIndex)) {
            map.set(it.blockIndex, { blockIndex: it.blockIndex, blockName: it.blockName, items: [] })
          }
          map.get(it.blockIndex)!.items.push(it)
        }
        return [...map.values()].sort((a, b) => a.blockIndex - b.blockIndex)
      },

      flatItems: () => get().items,

      musicItems: () => get().items.filter(i => i.itemType === 'music'),
    }),
    {
      name: 'pdl-setlist-store',
      partialize: (state) => ({ items: state.items, filename: state.filename }),
    }
  )
)
