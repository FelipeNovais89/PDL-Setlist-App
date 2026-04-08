import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-navy-900 border border-navy-700 rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-navy-700">
            <h2 className="text-white font-semibold text-lg">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none px-1">✕</button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
