/**
 * FullscreenSlides — modo apresentação com swipe horizontal entre músicas.
 *
 * Funcionalidades:
 * - Swipe horizontal (touch) entre slides
 * - Fullscreen API do browser
 * - Navegação por teclado (← →, Esc sai do fullscreen)
 * - Auto-hide dos controles após 2.2s de inatividade
 * - Transpõe acordes em tempo real
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SetlistItem } from '../../types'
import { SheetPage } from './SheetPage'
import { loadChordFromDrive } from '../../lib/drive'

interface Props {
  items: SetlistItem[]   // somente músicas (itemType === 'music')
  startIndex?: number
  onClose: () => void
}

export function FullscreenSlides({ items, startIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(startIndex)
  const [chords, setChords] = useState<Record<number, string>>({})
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Carrega cifra do item atual (e pré-carrega próxima) ───────────────
  const loadChord = useCallback(async (idx: number) => {
    const item = items[idx]
    if (!item || chords[idx] !== undefined) return
    const id = item.useSimplificada ? item.cifraSimplificadaId : item.cifraDriveId
    if (!id) { setChords(c => ({ ...c, [idx]: '' })); return }
    try {
      const text = await loadChordFromDrive(id)
      setChords(c => ({ ...c, [idx]: text }))
    } catch {
      setChords(c => ({ ...c, [idx]: '⚠ Erro ao carregar cifra' }))
    }
  }, [items, chords])

  useEffect(() => { loadChord(current) }, [current, loadChord])
  useEffect(() => { if (current + 1 < items.length) loadChord(current + 1) }, [current, loadChord, items.length])

  // ── Controles auto-hide ───────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 2200)
  }, [])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [resetHideTimer])

  // ── Fullscreen API ────────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Teclado ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resetHideTimer()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrent(c => Math.min(c + 1, items.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrent(c => Math.max(c - 1, 0))
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length, onClose, resetHideTimer])

  // ── Touch swipe ───────────────────────────────────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    resetHideTimer()
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y)
    touchStart.current = null
    if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return  // swipe muito pequeno ou vertical
    if (dx < 0) setCurrent(c => Math.min(c + 1, items.length - 1))
    else        setCurrent(c => Math.max(c - 1, 0))
  }

  const item    = items[current]
  const next    = items[current + 1]
  const cifra   = chords[current] ?? ''

  if (!item) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={resetHideTimer}
    >
      {/* Slide atual */}
      <div className="flex-1 overflow-hidden">
        <SheetPage
          item={item}
          chordText={cifra}
          nextTitle={next?.songTitle}
        />
      </div>

      {/* Controles overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => { setCurrent(c => Math.max(c - 1, 0)); resetHideTimer() }}
          disabled={current === 0}
          className="text-white bg-zinc-800/80 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-30 text-xl"
        >‹</button>

        <span className="text-zinc-400 text-sm">
          {current + 1} / {items.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="text-white bg-zinc-800/80 rounded-full w-10 h-10 flex items-center justify-center text-sm"
            title={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⤡' : '⤢'}
          </button>

          <button
            onClick={() => { setCurrent(c => Math.min(c + 1, items.length - 1)); resetHideTimer() }}
            disabled={current === items.length - 1}
            className="text-white bg-zinc-800/80 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-30 text-xl"
          >›</button>
        </div>
      </div>

      {/* Botão fechar (canto superior direito) */}
      <button
        onClick={onClose}
        className={`absolute top-3 right-3 text-zinc-400 hover:text-white bg-zinc-900/80 rounded-full w-9 h-9 flex items-center justify-center text-lg transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >✕</button>
    </div>
  )
}
