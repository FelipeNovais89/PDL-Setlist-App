import { useState, useRef } from 'react'
import { Button } from '../components/ui/Button'
import { ocrChordImage } from '../lib/gemini'
import { saveChordToDrive } from '../lib/drive'

export default function OcrPage() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [driveId, setDriveId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setImage(file)
    setResult('')
    setError(null)
    setPreview(URL.createObjectURL(file))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  async function handleOcr() {
    if (!image) return
    setLoading(true)
    setError(null)
    try {
      setResult(await ocrChordImage(image))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveToDrive() {
    if (!driveId.trim() || !result) return
    setSaving(true)
    setSaveMsg('')
    try {
      await saveChordToDrive(driveId.trim(), result)
      setSaveMsg('Salvo no Drive com sucesso!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg(`Erro: ${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white pb-24">
      <div className="sticky top-0 bg-navy-950 border-b border-navy-700 px-4 py-3 z-30">
        <h1 className="text-white font-semibold">OCR de Cifras</h1>
        <p className="text-zinc-500 text-xs">Envie uma foto da cifra para transcrição via Gemini AI</p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-navy-600 rounded-2xl p-6 text-center cursor-pointer hover:border-gold-400 transition-colors"
        >
          {preview
            ? <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
            : <div><p className="text-4xl mb-2">📷</p><p className="text-zinc-400 text-sm">Toque ou arraste uma imagem aqui</p></div>
          }
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        <Button variant="primary" size="lg" className="w-full justify-center" onClick={handleOcr} loading={loading} disabled={!image}>
          Transcrever com Gemini
        </Button>

        {error && <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Resultado</h2>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>Copiar</Button>
            </div>

            <textarea
              value={result}
              onChange={e => setResult(e.target.value)}
              rows={16}
              className="w-full bg-navy-800 text-zinc-200 border border-navy-600 rounded-xl px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:border-gold-400"
            />

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 block">
                Salvar no Drive (ID do arquivo existente)
                <input
                  type="text"
                  value={driveId}
                  onChange={e => setDriveId(e.target.value)}
                  placeholder="1abc...xyz"
                  className="mt-1 w-full bg-navy-800 text-white rounded-lg px-3 py-1.5 text-sm border border-navy-600 focus:outline-none focus:border-gold-400 font-mono"
                />
              </label>
              <Button variant="secondary" className="w-full justify-center" onClick={handleSaveToDrive} loading={saving} disabled={!driveId.trim()}>
                Salvar no Drive
              </Button>
              {saveMsg && (
                <p className={`text-sm text-center ${saveMsg.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
