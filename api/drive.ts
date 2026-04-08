/**
 * Vercel Edge Function — /api/drive
 *
 * GET  /api/drive?fileId=XXX          → retorna o texto do arquivo
 * POST /api/drive  { fileId, content } → salva o conteúdo no arquivo
 *
 * Variáveis de ambiente no Vercel:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL       — e-mail da service account
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — chave privada PEM
 *                                        (cole o valor do campo "private_key"
 *                                         do JSON, mantendo os \n literais —
 *                                         o Vercel os preserva corretamente)
 *
 * Como configurar a service account:
 *   1. Google Cloud Console → IAM & Admin → Service Accounts → + Create
 *   2. Ative a "Google Drive API" no projeto
 *   3. Gere uma chave JSON (Add Key → JSON)
 *   4. Copie "client_email" → GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   5. Copie "private_key"  → GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   6. Compartilhe cada arquivo/pasta do Drive com o e-mail da service account
 */

export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: Request): Promise<Response> {
  // ── Preflight ──────────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  // ── GET — leitura ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const fileId = new URL(req.url).searchParams.get('fileId')
    if (!fileId) {
      return new Response(JSON.stringify({ error: 'fileId obrigatório' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    try {
      const token = await getAccessToken()
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const body = await res.text()
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Drive retornou ${res.status}`, detail: body }),
          { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(body, {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Erro interno', detail: String(err) }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── POST — escrita ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body: { fileId?: string; content?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const { fileId, content } = body
    if (!fileId || content === undefined) {
      return new Response(JSON.stringify({ error: 'fileId e content obrigatórios' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    try {
      const token = await getAccessToken()
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain; charset=utf-8',
          },
          body: content,
        }
      )
      if (!res.ok) {
        const detail = await res.text()
        return new Response(
          JSON.stringify({ error: `Drive retornou ${res.status}`, detail }),
          { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Erro interno', detail: String(err) }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response('Method not allowed', { status: 405, headers: CORS })
}

// ─── JWT / Service Account ────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
                 ?? process.env.GOOGLE_SERVICE_ACCOUNT_KEY  // compat legado

  if (!email || !rawKey) {
    throw new Error(
      'Variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ' +
      'não configuradas no Vercel.'
    )
  }

  // O Vercel preserva \n literais — normaliza para quebras de linha reais
  const pem = rawKey.replace(/\\n/g, '\n')

  const now   = Math.floor(Date.now() / 1000)
  const claim = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }

  const header    = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload   = b64url(JSON.stringify(claim))
  const sigInput  = `${header}.${payload}`
  const cryptoKey = await importPem(pem)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(sigInput)
  )
  const jwt = `${sigInput}.${b64url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer' +
      `&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Falha ao obter token OAuth: ${tokenRes.status} — ${err}`)
  }

  const data = await tokenRes.json() as { access_token?: string; error?: string }
  if (!data.access_token) {
    throw new Error(`Token OAuth vazio: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

function b64url(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function importPem(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return crypto.subtle.importKey(
    'pkcs8',
    buf.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}
