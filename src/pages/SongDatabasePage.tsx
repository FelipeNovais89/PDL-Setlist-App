import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { DataTable, type Column, type ChipFilterDef } from '../components/ui/DataTable'
import { useSongsStore } from '../store/useSongsStore'
import { fetchSongsCSV, saveSongsCSV } from '../lib/github'
import type { Song } from '../types'

const columns: Column<Song>[] = [
  { key: 'titulo',              header: 'Título',    editable: true, sortable: true,  width: 'min-w-[160px]' },
  { key: 'artista',             header: 'Artista',   editable: true, sortable: true,  width: 'min-w-[120px]' },
  { key: 'tomOriginal',         header: 'Tom',       editable: true, sortable: true,  width: 'w-16' },
  { key: 'bpm',                 header: 'BPM',       editable: true, sortable: true,  width: 'w-16' },
  { key: 'cifraDriveId',        header: 'Drive ID',  editable: true, sortable: false, width: 'min-w-[180px]' },
  { key: 'cifraSimplificadaId', header: 'ID Simpl.', editable: true, sortable: false, width: 'min-w-[180px]' },
]

const chipFilters: ChipFilterDef[] = [
  { key: 'artista',     label: 'Artista' },
  { key: 'tomOriginal', label: 'Tom'     },
]

export default function SongDatabasePage() {
  const { songs, loading, error, setSongs, setLoading, setError, addSong, updateSong, removeSong } =
    useSongsStore()
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (songs.length > 0) return
    setLoading(true)
    fetchSongsCSV()
      .then(setSongs)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      await saveSongsCSV(songs)
      setSaveMsg('Salvo com sucesso!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg(`Erro: ${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  function handleUpdate(index: number, key: keyof Song & string, value: string) {
    updateSong(index, { [key]: value } as Partial<Song>)
  }

  function handleAdd() {
    addSong({
      titulo: 'Nova Música', artista: '', tomOriginal: '',
      bpm: '', cifraDriveId: '', cifraSimplificadaId: '',
    })
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-navy-950 border-b border-navy-700 px-4 py-3 z-30 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-white font-semibold">Banco de Músicas</h1>
          <p className="text-zinc-500 text-xs">{songs.length} músicas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleAdd}>+ Música</Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Salvar</Button>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading && <p className="text-zinc-400 text-sm">Carregando músicas...</p>}
        {error   && <p className="text-red-400 text-sm mb-2">{error}</p>}
        {saveMsg && (
          <p className={`text-sm mb-2 ${saveMsg.startsWith('Erro') ? 'text-red-400' : 'text-green-400'}`}>
            {saveMsg}
          </p>
        )}

        {!loading && (
          <DataTable<Song>
            data={songs}
            columns={columns}
            onUpdate={handleUpdate}
            onDelete={removeSong}
            filterKeys={['titulo', 'artista']}
            chipFilters={chipFilters}
          />
        )}
      </div>
    </div>
  )
}
