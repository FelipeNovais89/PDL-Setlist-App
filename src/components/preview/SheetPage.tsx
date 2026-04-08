/**
 * SheetPage — reproduz exatamente o layout do build_sheet_page_html do original.
 * Header | OBS | cifra (auto-fit) | PREPARAÇÃO | Footer
 */

import { useEffect, useRef } from 'react'
import type { SetlistItem } from '../../types'
import { transposeChordText } from '../../lib/transpose'

interface Props {
  item: SetlistItem
  chordText: string
  nextTitle?: string
  displayTom?: string
}

function renderCifra(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    const isChord = line.startsWith('|')
    const display = isChord ? line.substring(1) : line
    return (
      <div
        key={i}
        className={`whitespace-pre leading-snug ${
          isChord ? 'text-blue-400 font-bold tracking-wide' : 'text-zinc-200'
        }`}
      >
        {display || '\u00A0'}
      </div>
    )
  })
}

export function SheetPage({ item, chordText, nextTitle, displayTom }: Props) {
  const cifraRef = useRef<HTMLDivElement>(null)

  const tom = displayTom ?? item.tom
  const transposedText =
    displayTom && displayTom !== item.tom
      ? transposeChordText(chordText, item.tom, displayTom)
      : chordText

  useEffect(() => {
    const el = cifraRef.current
    if (!el) return
    let size = 14
    el.style.fontSize = `${size}px`
    while (el.scrollWidth > el.clientWidth && size > 7) {
      size -= 0.5
      el.style.fontSize = `${size}px`
    }
  }, [transposedText])

  return (
    <div className="h-full flex flex-col bg-navy-950 text-white font-mono select-none overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-3 pb-2 border-b border-navy-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gold-400 leading-tight truncate">
              {item.songTitle || '—'}
            </h1>
            <p className="text-sm text-zinc-400 truncate">{item.artist}</p>
          </div>
          <div className="flex-none text-right space-y-0.5">
            {tom && (
              <div className="bg-blue-900/60 text-blue-300 rounded px-2 py-0.5 font-bold text-sm">
                {tom}
              </div>
            )}
            {item.bpm && (
              <div className="text-xs text-zinc-500">♩ {item.bpm}</div>
            )}
          </div>
        </div>
      </div>

      {/* OBS */}
      {item.obs && (
        <div className="flex-none mx-4 mt-2 px-3 py-2 bg-blue-950/50 border border-blue-800/50 rounded-lg text-xs text-blue-200">
          <span className="font-bold text-blue-400">OBS: </span>{item.obs}
        </div>
      )}

      {/* Cifra */}
      <div
        ref={cifraRef}
        className="flex-1 overflow-x-auto overflow-y-auto px-4 py-3"
        style={{ fontSize: '13px' }}
      >
        {transposedText
          ? renderCifra(transposedText)
          : <p className="text-zinc-600 italic">Cifra não carregada</p>}
      </div>

      {/* PREPARAÇÃO */}
      {item.preparacao && (
        <div className="flex-none mx-4 mb-2 px-3 py-2 bg-red-950/50 border border-red-800/50 rounded-lg text-xs text-red-200">
          <span className="font-bold text-red-400">PREPARAÇÃO: </span>{item.preparacao}
        </div>
      )}

      {/* Footer */}
      {nextTitle && (
        <div className="flex-none px-4 py-2 border-t border-navy-700 text-xs text-zinc-500 text-right">
          → {nextTitle}
        </div>
      )}
    </div>
  )
}
