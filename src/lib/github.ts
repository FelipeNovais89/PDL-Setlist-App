/**
 * Funções de integração com GitHub Contents API.
 * Lê e escreve CSVs de setlist e o banco de músicas.
 */

import Papa from 'papaparse'
import type { SetlistItem, Song, GitHubFile } from '../types'
import { SETLIST_COLS } from '../types'

const OWNER  = import.meta.env.VITE_GITHUB_OWNER  as string
const REPO   = import.meta.env.VITE_GITHUB_REPO   as string
const BRANCH = (import.meta.env.VITE_GITHUB_BRANCH as string) || 'main'
const DIR    = (import.meta.env.VITE_GITHUB_SETLISTS_DIR as string) || 'Data/Setlists'

function token(): string {
  return import.meta.env.VITE_GITHUB_TOKEN as string
}

function authHeaders(): HeadersInit {
  const t = token()
  return t
    ? { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' }
    : { Accept: 'application/vnd.github+json' }
}

const API = `https://api.github.com/repos/${OWNER}/${REPO}`

// ─── Banco de músicas ─────────────────────────────────────────────────────────

export async function fetchSongsCSV(): Promise<Song[]> {
  const url = import.meta.env.VITE_SONGS_CSV_URL as string
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao buscar músicas: ${res.status}`)
  const text = await res.text()
  return parseSongsCSV(text)
}

export function parseSongsCSV(csv: string): Song[] {
  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  })
  return data.map(row => ({
    titulo:              row['Título']             ?? row['Titulo']             ?? '',
    artista:             row['Artista']            ?? '',
    tomOriginal:         row['Tom_Original']       ?? '',
    bpm:                 row['BPM']                ?? '',
    cifraDriveId:        row['CifraDriveID']       ?? '',
    cifraSimplificadaId: row['CifraSimplificadaID'] ?? '',
  }))
}

export function songsToCSV(songs: Song[]): string {
  return Papa.unparse(songs.map(s => ({
    'Título':             s.titulo,
    'Artista':            s.artista,
    'Tom_Original':       s.tomOriginal,
    'BPM':                s.bpm,
    'CifraDriveID':       s.cifraDriveId,
    'CifraSimplificadaID': s.cifraSimplificadaId,
  })))
}

// ─── Setlists ─────────────────────────────────────────────────────────────────

export async function listSetlists(): Promise<GitHubFile[]> {
  const res = await fetch(`${API}/contents/${DIR}?ref=${BRANCH}`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`Erro ao listar setlists: ${res.status}`)
  }
  const data = await res.json()
  return (Array.isArray(data) ? data : []).filter((f: GitHubFile) => f.name.endsWith('.csv'))
}

export async function loadSetlist(file: GitHubFile): Promise<SetlistItem[]> {
  const res = await fetch(file.download_url)
  if (!res.ok) throw new Error(`Erro ao carregar setlist: ${res.status}`)
  const text = await res.text()
  return parseSetlistCSV(text)
}

export function parseSetlistCSV(csv: string): SetlistItem[] {
  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  })
  return data.map(row => ({
    blockIndex:          Number(row['BlockIndex'] ?? 1),
    blockName:           row['BlockName']          ?? '',
    itemIndex:           Number(row['ItemIndex']   ?? 1),
    itemType:            (row['ItemType'] === 'pause' ? 'pause' : 'music') as 'music' | 'pause',
    songTitle:           row['SongTitle']           ?? '',
    artist:              row['Artist']              ?? '',
    tom:                 row['Tom']                 ?? '',
    bpm:                 row['BPM']                 ?? '',
    cifraDriveId:        row['CifraDriveID']        ?? '',
    cifraSimplificadaId: row['CifraSimplificadaID'] ?? '',
    useSimplificada:     row['UseSimplificada'] === '1' || row['UseSimplificada'] === 'true',
    pauseLabel:          row['PauseLabel']          ?? '',
    obs:                 row['Obs']                 ?? '',
    preparacao:          row['Preparacao']          ?? '',
  }))
}

export function setlistToCSV(items: SetlistItem[]): string {
  return Papa.unparse(
    items.map(i => ({
      BlockIndex:          i.blockIndex,
      BlockName:           i.blockName,
      ItemIndex:           i.itemIndex,
      ItemType:            i.itemType,
      SongTitle:           i.songTitle,
      Artist:              i.artist,
      Tom:                 i.tom,
      BPM:                 i.bpm,
      CifraDriveID:        i.cifraDriveId,
      CifraSimplificadaID: i.cifraSimplificadaId,
      UseSimplificada:     i.useSimplificada ? '1' : '0',
      PauseLabel:          i.pauseLabel,
      Obs:                 i.obs,
      Preparacao:          i.preparacao,
    })),
    { columns: [...SETLIST_COLS] }
  )
}

export async function saveSetlist(filename: string, items: SetlistItem[]): Promise<void> {
  const path = `${DIR}/${filename}`
  const content = btoa(unescape(encodeURIComponent(setlistToCSV(items))))

  // Busca SHA se o arquivo já existe
  let sha: string | undefined
  const existing = await fetch(`${API}/contents/${path}?ref=${BRANCH}`, {
    headers: authHeaders(),
  })
  if (existing.ok) {
    const data = await existing.json()
    sha = data.sha
  }

  const body: Record<string, unknown> = {
    message: `chore: update setlist ${filename}`,
    content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${API}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Erro ao salvar setlist: ${res.status} — ${JSON.stringify(err)}`)
  }
}

export async function saveSongsCSV(songs: Song[]): Promise<void> {
  const path = 'Data/PDL_musicas.csv'
  const content = btoa(unescape(encodeURIComponent(songsToCSV(songs))))

  let sha: string | undefined
  const existing = await fetch(`${API}/contents/${path}?ref=${BRANCH}`, {
    headers: authHeaders(),
  })
  if (existing.ok) {
    const data = await existing.json()
    sha = data.sha
  }

  const body: Record<string, unknown> = {
    message: 'chore: update songs database',
    content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${API}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Erro ao salvar músicas: ${res.status} — ${JSON.stringify(err)}`)
  }
}
