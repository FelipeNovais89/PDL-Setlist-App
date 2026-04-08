import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { BlockCard } from '../components/setlist/BlockCard'
import { SheetPage } from '../components/preview/SheetPage'
import { FullscreenSlides } from '../components/preview/FullscreenSlides'
import { useSetlistStore } from '../store/useSetlistStore'
import { saveSetlist } from '../lib/github'
import { loadChordFromDrive } from '../lib/drive'
import { exportSetlistPDF, exportSheetPDF } from '../lib/pdf'
import type { SetlistItem } from '../types'

export default function EditorPage() {
  const navigate = useNavigate()
  const store = useSetlistStore()
  const blocks = store.blocks()
  const musicItems = store.musicItems()

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<SetlistItem | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [slidesOpen, setSlidesOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [filenameModalOpen, setFilenameModalOpen] = useState(false)
  const [editFilename, setEditFilename] = useState(store.filename)

  async function handlePreview(item: SetlistItem) {
    setPreviewItem(item)
    setPreviewText('')
    setPreviewLoading(true)
    const id = item.useSimplificada ? item.cifraSimplificadaId : item.cifraDriveId
    try {
      if (id) setPreviewText(await loadChordFromDrive(id))
    } catch {
      setPreviewText('⚠ Erro ao carregar cifra')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await saveSetlist(store.filename, store.items)
      useSetlistStore.setState({ isDirty: false })
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const sheets = await Promise.all(
        musicItems.map(async item => {
          const id = item.useSimplificada ? item.cifraSimplificadaId : item.cifraDriveId
          const chordText = id ? await loadChordFromDrive(id).catch(() => '') : ''
          return { item, chordText }
        })
      )
      await exportSetlistPDF(sheets)
    } finally {
      setExportingPdf(false)
    }
  }

  if (store.items.length === 0 && blocks.length === 0) {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center gap-4 pb-20">
        <p className="text-zinc-500">Nenhuma setlist carregada.</p>
        <Button onClick={() => navigate('/')}>← Voltar ao início</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white pb-24">
      {/* Top bar */}
      <div className="sticky top-0 bg-navy-950 border-b border-navy-700 px-4 py-3 z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <button
              onClick={() => { setEditFilename(store.filename); setFilenameModalOpen(true) }}
              className="text-gold-400 font-semibold text-sm truncate max-w-[180px] hover:underline"
            >
              {store.filename}
            </button>
            {store.isDirty && <span className="ml-1 text-xs text-zinc-500">●</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSlidesOpen(true)} disabled={musicItems.length === 0}>▶</Button>
            <Button variant="ghost" size="sm" onClick={handleExportPdf} loading={exportingPdf} disabled={musicItems.length === 0}>PDF</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Salvar</Button>
          </div>
        </div>
        {saveError && <p className="text-red-400 text-xs mt-1 whitespace-pre-wrap">{saveError}</p>}
      </div>

      {/* Blocos */}
      <div className="px-4 py-4 space-y-4">
        {blocks.map(block => (
          <BlockCard key={block.blockIndex} block={block} onPreview={handlePreview} />
        ))}
        <Button variant="secondary" className="w-full justify-center" onClick={() => store.addBlock()}>
          + Novo Bloco
        </Button>
      </div>

      {/* Modal: renomear arquivo */}
      <Modal open={filenameModalOpen} onClose={() => setFilenameModalOpen(false)} title="Renomear arquivo">
        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={editFilename}
            onChange={e => setEditFilename(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { store.setFilename(editFilename); setFilenameModalOpen(false) }
            }}
            className="w-full bg-navy-800 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-gold-400"
          />
          <Button variant="primary" className="w-full justify-center"
            onClick={() => { store.setFilename(editFilename); setFilenameModalOpen(false) }}>OK</Button>
        </div>
      </Modal>

      {/* Modal: preview de cifra */}
      <Modal open={!!previewItem} onClose={() => setPreviewItem(null)} title="" maxWidth="max-w-2xl">
        {previewItem && (
          <div className="h-[75vh] -m-5 rounded-2xl overflow-hidden relative">
            {previewLoading
              ? <div className="flex items-center justify-center h-full text-zinc-400">Carregando cifra...</div>
              : <SheetPage item={previewItem} chordText={previewText}
                  nextTitle={musicItems[musicItems.indexOf(previewItem) + 1]?.songTitle} />
            }
            <div className="absolute bottom-4 right-4">
              <Button variant="secondary" size="sm"
                onClick={() => previewItem && exportSheetPDF({ item: previewItem, chordText: previewText })}>
                PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {slidesOpen && (
        <FullscreenSlides items={musicItems} startIndex={0} onClose={() => setSlidesOpen(false)} />
      )}
    </div>
  )
}
