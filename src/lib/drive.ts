/**
 * Integração com Google Drive via relay (Vercel Edge Function).
 * O service account NÃO funciona no browser diretamente — todas as chamadas
 * passam pelo endpoint /api/drive-read e /api/drive-write.
 *
 * Cache local de 120s (igual ao original Python).
 */

const RELAY = (import.meta.env.VITE_DRIVE_RELAY_URL as string) || ''

interface CacheEntry {
  text: string
  ts: number
}
const _cache: Map<string, CacheEntry> = new Map()
const CACHE_TTL = 120_000 // 120s

export async function loadChordFromDrive(fileId: string): Promise<string> {
  if (!fileId) return ''

  const cached = _cache.get(fileId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.text
  }

  const url = RELAY
    ? `${RELAY}/api/drive-read?fileId=${encodeURIComponent(fileId)}`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Drive read error ${res.status}`)
  const text = await res.text()

  _cache.set(fileId, { text, ts: Date.now() })
  return text
}

export async function saveChordToDrive(fileId: string, content: string): Promise<void> {
  const url = RELAY
    ? `${RELAY}/api/drive-write`
    : '/api/drive-write' // fallback para proxy local

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, content }),
  })
  if (!res.ok) throw new Error(`Drive write error ${res.status}`)

  // Invalida cache
  _cache.delete(fileId)
}

export function clearDriveCache(fileId?: string): void {
  if (fileId) {
    _cache.delete(fileId)
  } else {
    _cache.clear()
  }
}
