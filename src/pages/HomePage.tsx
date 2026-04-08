import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useSetlistStore } from '../store/useSetlistStore'
import { listSetlists, loadSetlist } from '../lib/github'
import type { GitHubFile } from '../types'

export default function HomePage() {
  const navigate  = useNavigate()
  const { loadItems, clearSetlist, setFilename, filename, items } = useSetlistStore()

  const [loadModalOpen, setLoadModalOpen] = useState(false)
  const [setlists, setSetlists] = useState<GitHubFile[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openLoadModal() {
    setLoadModalOpen(true)
    setLoadingList(true)
    setError(null)
    try {
      const list = await listSetlists()
      setSetlists(list)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingList(false)
    }
  }

  async function handleLoad(file: GitHubFile) {
    setLoadingFile(file.name)
    setError(null)
    try {
      const rows = await loadSetlist(file)
      loadItems(rows, file.name)
      setLoadModalOpen(false)
      navigate('/editor')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingFile(null)
    }
  }

  function handleNew() {
    const name = (newName.trim() || 'nova_setlist') + '.csv'
    clearSetlist()
    setFilename(name)
    setNewModalOpen(false)
    navigate('/editor')
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center px-6 pb-20">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🎵</div>
        <h1 className="text-3xl font-bold text-gold-400">PDL Setlist</h1>
        <p className="text-zinc-500 text-sm mt-1">Gerenciador de setlists para pagode</p>
      </div>

      {/* Setlist atual */}
      {items.length > 0 && (
        <div className="w-full max-w-sm mb-6 bg-navy-800 rounded-2xl border border-navy-700 px-4 py-3">
          <p className="text-xs text-zinc-500 mb-1">Setlist em edição</p>
          <p className="text-white font-medium truncate">{filename}</p>
          <p className="text-zinc-400 text-sm">{items.filter(i => i.itemType === 'music').length} músicas</p>
          <Button variant="primary" className="mt-3 w-full justify-center" onClick={() => navigate('/editor')}>
            Continuar editando →
          </Button>
        </div>
      )}

      {/* Ações */}
      <div className="w-full max-w-sm space-y-3">
        <Button variant="primary" size="lg" className="w-full justify-center" onClick={() => setNewModalOpen(true)}>
          + Nova Setlist
        </Button>
        <Button variant="secondary" size="lg" className="w-full justify-center" onClick={openLoadModal}>
          Carregar do GitHub
        </Button>
      </div>

      {error && (
        <div className="mt-4 bg-red-950 border border-red-800 rounded-lg px-4 py-2 text-red-300 text-sm max-w-sm w-full whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Modal: nova setlist */}
      <Modal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="Nova Setlist">
        <div className="space-y-4">
          <label className="block text-sm text-zinc-400">
            Nome do arquivo
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNew() }}
              placeholder="nome_da_setlist"
              className="mt-1 w-full bg-navy-800 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-gold-400"
            />
            <span className="text-xs text-zinc-600">.csv será adicionado automaticamente</span>
          </label>
          <Button variant="primary" className="w-full justify-center" onClick={handleNew}>Criar</Button>
        </div>
      </Modal>

      {/* Modal: carregar */}
      <Modal open={loadModalOpen} onClose={() => setLoadModalOpen(false)} title="Carregar Setlist">
        {loadingList ? (
          <p className="text-center text-zinc-400 py-4">Carregando...</p>
        ) : setlists.length === 0 && !error ? (
          <p className="text-center text-zinc-600 py-4">Nenhuma setlist encontrada no GitHub</p>
        ) : (
          <div className="space-y-2">
            {setlists.map(file => (
              <button
                key={file.sha}
                onClick={() => handleLoad(file)}
                disabled={loadingFile === file.name}
                className="w-full text-left px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 transition-colors disabled:opacity-50"
              >
                <p className="text-white text-sm font-medium">{file.name.replace('.csv', '')}</p>
                <p className="text-zinc-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="text-red-400 text-xs mt-2 whitespace-pre-wrap">{error}</p>
        )}
      </Modal>
    </div>
  )
}
