import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useSetlistStore } from '../store/useSetlistStore'
import { listSetlists, loadSetlist } from '../lib/github'
import type { GitHubFile } from '../types'

// ─── URLs testadas pelo debug (mesmas do github.ts) ──────────────────────────
const DEBUG_OWNER      = 'FelipeNovais89'
const DEBUG_DATA_REPO  = import.meta.env.VITE_GITHUB_DATA_REPO || 'PDLSetlist'
const DEBUG_BRANCH     = import.meta.env.VITE_GITHUB_BRANCH    || 'main'
const DEBUG_DIR        = import.meta.env.VITE_GITHUB_SETLISTS_DIR || 'Data/setlists'
const DEBUG_TOKEN      = import.meta.env.VITE_GITHUB_TOKEN     || ''

interface DebugResult {
  url: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: unknown
  error?: string
}

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

  // Debug state
  const [debugLoading, setDebugLoading] = useState(false)
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [debugOpen, setDebugOpen] = useState(false)

  async function runDebug() {
    setDebugLoading(true)
    setDebugResults([])
    setDebugOpen(true)

    const results: DebugResult[] = []

    // Testa 3 URLs: com letras diferentes no dir para descobrir o path correto
    const paths = [
      `Data/setlists`,   // lowercase
      `Data/Setlists`,   // uppercase S
      `Data`,            // listagem da pasta pai
    ]

    for (const dir of paths) {
      const url = `https://api.github.com/repos/${DEBUG_OWNER}/${DEBUG_DATA_REPO}/contents/${dir}?ref=${DEBUG_BRANCH}`
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
      if (DEBUG_TOKEN) headers['Authorization'] = `Bearer ${DEBUG_TOKEN}`

      try {
        const res = await fetch(url, { headers })
        const respHeaders: Record<string, string> = {}
        res.headers.forEach((v, k) => { respHeaders[k] = v })

        let body: unknown
        try { body = await res.json() }
        catch { body = await res.text().catch(() => '(sem body)') }

        results.push({
          url,
          status: res.status,
          statusText: res.statusText,
          headers: respHeaders,
          body,
        })
      } catch (e) {
        results.push({
          url,
          status: 0,
          statusText: 'NETWORK ERROR',
          headers: {},
          body: null,
          error: String(e),
        })
      }
    }

    // Também testa se o token é válido via /user
    const userUrl = 'https://api.github.com/user'
    try {
      const res = await fetch(userUrl, {
        headers: DEBUG_TOKEN
          ? { Authorization: `Bearer ${DEBUG_TOKEN}`, Accept: 'application/vnd.github+json' }
          : { Accept: 'application/vnd.github+json' },
      })
      let body: unknown
      try { body = await res.json() }
      catch { body = '(sem body)' }
      results.push({ url: userUrl, status: res.status, statusText: res.statusText, headers: {}, body })
    } catch (e) {
      results.push({ url: userUrl, status: 0, statusText: 'NETWORK ERROR', headers: {}, body: null, error: String(e) })
    }

    setDebugResults(results)
    setDebugLoading(false)
  }

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

        {/* ── DEBUG ── */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center border border-dashed border-yellow-700 text-yellow-600 hover:text-yellow-400"
          onClick={runDebug}
          loading={debugLoading}
        >
          🔍 Debug GitHub API
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
              autoFocus type="text" value={newName}
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
        {error && <p className="text-red-400 text-xs mt-2 whitespace-pre-wrap">{error}</p>}
      </Modal>

      {/* Modal: debug */}
      <Modal open={debugOpen} onClose={() => setDebugOpen(false)} title="🔍 Debug GitHub API" maxWidth="max-w-2xl">
        <div className="space-y-4 text-xs font-mono">
          {/* Config usada */}
          <div className="bg-navy-950 rounded-lg p-3 space-y-1 text-zinc-400">
            <p><span className="text-zinc-500">DATA_REPO:</span> <span className="text-white">{DEBUG_DATA_REPO}</span></p>
            <p><span className="text-zinc-500">BRANCH:</span>    <span className="text-white">{DEBUG_BRANCH}</span></p>
            <p><span className="text-zinc-500">DIR:</span>       <span className="text-white">{DEBUG_DIR}</span></p>
            <p><span className="text-zinc-500">TOKEN:</span>     <span className={DEBUG_TOKEN ? 'text-green-400' : 'text-red-400'}>{DEBUG_TOKEN ? `✓ configurado (${DEBUG_TOKEN.slice(0,8)}…)` : '✗ NÃO configurado (VITE_GITHUB_TOKEN vazio)'}</span></p>
          </div>

          {debugLoading && <p className="text-zinc-400 text-center py-4">Testando URLs...</p>}

          {debugResults.map((r, i) => (
            <div key={i} className="border border-navy-700 rounded-lg overflow-hidden">
              {/* URL + status */}
              <div className={`flex items-center justify-between px-3 py-2 ${r.status === 200 ? 'bg-green-950' : r.status === 0 ? 'bg-red-950' : 'bg-yellow-950'}`}>
                <span className="text-zinc-300 break-all">{r.url}</span>
                <span className={`ml-2 font-bold flex-none ${r.status === 200 ? 'text-green-400' : r.status === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {r.status || 'ERR'} {r.statusText}
                </span>
              </div>

              {/* Erro de rede */}
              {r.error && (
                <div className="px-3 py-2 bg-red-950/50 text-red-300">{r.error}</div>
              )}

              {/* Body */}
              <pre className="px-3 py-2 text-zinc-300 overflow-x-auto max-h-48 text-[10px] leading-relaxed bg-navy-950">
                {JSON.stringify(r.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
