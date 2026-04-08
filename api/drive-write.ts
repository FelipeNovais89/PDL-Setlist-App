/**
 * Vercel Edge Function: POST /api/drive-write
 * Body JSON: { fileId: string, content: string }
 *
 * Sobrescreve o conteúdo de um arquivo TXT existente no Google Drive.
 * Mesmas variáveis de ambiente que drive-read.ts.
 */

export const config = { runtime: 'edge' }

const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  let body: { fileId: string; content: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  const { fileId, content } = body
  if (!fileId || content === undefined) {
    return new Response('Missing fileId or content', { status: 400, headers: corsHeaders })
  }

  try {
    const token = await getAccessToken()

    const res = await fetch(`${DRIVE_UPLOAD}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: content,
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(`Drive error: ${res.status} — ${err}`, { status: res.status, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
}

// ─── (mesma lógica JWT de drive-read.ts) ─────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const rawKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '').replace(/\\n/g, '\n')
  const now    = Math.floor(Date.now() / 1000)
  const claim  = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify(claim))
  const sigInput = `${header}.${payload}`
  const key = await importPrivateKey(rawKey)
  const sig  = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput))
  const jwt  = `${sigInput}.${base64url(sig)}`
  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json() as { access_token: string }
  return data.access_token
}

function base64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return crypto.subtle.importKey(
    'pkcs8', buf.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
}
