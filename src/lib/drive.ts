/**
 * Integração com Google Drive via Vercel Edge Function /api/drive.
 *
 * GET  /api/drive?fileId=XXX           → lê o texto da cifra
 * POST /api/drive { fileId, content }  → salva o texto da cifra
 *
 * Cache local de 120s por fileId.
 */

interface CacheEntry { text: string; ts: number }
const _cache = new Map<string, CacheEntry>()
const CACHE_TTL = 120_000

export async function loadChordFromDrive(fileId: string): Promise<string> {
  if (!fileId) return ''

  const cached = _cache.get(fileId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.text

  const url = `/api/drive?fileId=${encodeURIComponent(fileId)}`
  const res  = await fetch(url)

  if (!res.ok) {
    // Tenta ler mensagem de erro estruturada
    let detail = ''
    try { detail = JSON.stringify(await res.json()) }
    catch { detail = await res.text().catch(() => '') }
    throw new Error(`Drive: HTTP ${res.status} — ${detail}`)
  }

  const text = await res.text()
  _cache.set(fileId, { text, ts: Date.now() })
  return text
}

export async function saveChordToDrive(fileId: string, content: string): Promise<void> {
  const res = await fetch('/api/drive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, content }),
  })

  if (!res.ok) {
    let detail = ''
    try { detail = JSON.stringify(await res.json()) }
    catch { detail = await res.text().catch(() => '') }
    throw new Error(`Drive: HTTP ${res.status} — ${detail}`)
  }

  _cache.delete(fileId)
}

export function clearDriveCache(fileId?: string): void {
  if (fileId) _cache.delete(fileId)
  else        _cache.clear()
}
