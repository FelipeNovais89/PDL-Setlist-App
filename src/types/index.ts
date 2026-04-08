// ─── Banco de músicas ────────────────────────────────────────────────────────

export interface Song {
  titulo: string
  artista: string
  tomOriginal: string
  bpm: string
  cifraDriveId: string
  cifraSimplificadaId: string
}

// ─── Setlist ─────────────────────────────────────────────────────────────────

export type ItemType = 'music' | 'pause'

export interface SetlistItem {
  blockIndex: number
  blockName: string
  itemIndex: number
  itemType: ItemType
  songTitle: string
  artist: string
  tom: string
  bpm: string
  cifraDriveId: string
  cifraSimplificadaId: string
  useSimplificada: boolean
  pauseLabel: string
  obs: string
  preparacao: string
}

export interface Block {
  blockIndex: number
  blockName: string
  items: SetlistItem[]
}

// ─── GitHub ──────────────────────────────────────────────────────────────────

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  download_url: string
}

// ─── Preview ─────────────────────────────────────────────────────────────────

export interface SheetData {
  item: SetlistItem
  chordText: string
  nextTitle?: string
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

/** Colunas exatas do CSV de setlist */
export const SETLIST_COLS = [
  'BlockIndex', 'BlockName', 'ItemIndex', 'ItemType',
  'SongTitle', 'Artist', 'Tom', 'BPM',
  'CifraDriveID', 'CifraSimplificadaID', 'UseSimplificada',
  'PauseLabel', 'Obs', 'Preparacao',
] as const

/** Colunas do banco de músicas */
export const SONGS_COLS = [
  'Título', 'Artista', 'Tom_Original', 'BPM', 'CifraDriveID', 'CifraSimplificadaID',
] as const
