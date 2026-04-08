/**
 * OCR de cifras via Gemini 2.0 Flash.
 * Recebe uma imagem (File | Blob) e retorna o texto da cifra.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const PROMPT = `Você é um transcritor de cifras de música brasileira.
Analise a imagem e transcreva a cifra EXATAMENTE como está, preservando:
- Linhas de acorde (prefixadas com "|" — adicione o "|" em cada linha de acorde)
- Letras da música nas linhas sem prefixo
- Seções como [Intro], [Verso], [Refrão], etc.
- Espaçamento entre acordes (use espaços para alinhar os acordes sobre as sílabas certas)

Retorne APENAS o texto da cifra, sem explicações adicionais.`

export async function ocrChordImage(imageFile: File): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY não configurada')

  // Converte imagem para base64
  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return text.trim()
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove o prefixo "data:image/...;base64,"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
