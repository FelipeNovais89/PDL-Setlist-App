/**
 * Lógica de transposição de acordes.
 * Portada do Python original para TypeScript, preservando comportamento idêntico.
 *
 * Linhas de acorde são identificadas pelo prefixo "|".
 * Linhas sem "|" (letras) são passadas sem alteração.
 */

// ─── Tabelas de notas ─────────────────────────────────────────────────────────

const NOTE_SEQ_SHARP: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_SEQ_FLAT: string[]  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 3+1,   // 4
  'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11,
}

// Corrige E = 4
NOTE_TO_INDEX['E'] = 4

// Tonalidades que preferem bemóis
const FLAT_KEYS = new Set([
  'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb',
  'Fm', 'Bbm', 'Ebm', 'Abm', 'Dbm', 'Gbm',
  'Dm', 'Gm', 'Cm',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escolhe bemóis ou sustenidos baseado na tonalidade alvo */
function preferFlats(tone: string): boolean {
  return FLAT_KEYS.has(tone)
}

/**
 * Calcula a diferença em semitons entre duas tonalidades.
 * Ignora sufixo "m" (menor): C e Cm têm o mesmo índice 0.
 */
export function semitone_diff(fromTone: string, toTone: string): number {
  const normalize = (t: string) => t.replace(/m$/, '').trim()
  const from = NOTE_TO_INDEX[normalize(fromTone)]
  const to   = NOTE_TO_INDEX[normalize(toTone)]
  if (from === undefined || to === undefined) return 0
  return ((to - from) + 12) % 12
}

/**
 * Transpõe um símbolo de acorde individual.
 * Suporta: C, Cm, C7, Cmaj7, C#m7b5, C/E, etc.
 */
export function transposeChordSymbol(chord: string, delta: number, useFlats: boolean): string {
  if (delta === 0) return chord

  const seq = useFlats ? NOTE_SEQ_FLAT : NOTE_SEQ_SHARP

  // Trata slash chords: C/E → transpõe raiz e baixo separadamente
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/', 2)
    return transposeChordSymbol(root, delta, useFlats) + '/' + transposeChordSymbol(bass, delta, useFlats)
  }

  // Extrai a nota raiz (1 ou 2 caracteres: C, C#, Db, etc.)
  let rootNote = ''
  let suffix = ''

  if (chord.length >= 2 && (chord[1] === '#' || chord[1] === 'b')) {
    rootNote = chord.substring(0, 2)
    suffix = chord.substring(2)
  } else if (chord.length >= 1) {
    rootNote = chord.substring(0, 1)
    suffix = chord.substring(1)
  } else {
    return chord
  }

  const idx = NOTE_TO_INDEX[rootNote]
  if (idx === undefined) return chord  // não é uma nota conhecida

  const newIdx = (idx + delta + 12) % 12
  return seq[newIdx] + suffix
}

/**
 * Transpõe todos os acordes em uma linha de cifra.
 * Linhas de acorde são identificadas pelo prefixo "|".
 * Preserva espaçamento original para que os acordes fiquem acima das sílabas corretas.
 */
function transposeLine(line: string, delta: number, useFlats: boolean): string {
  if (delta === 0) return line

  // Divide a linha em tokens: acordes e espaços/separadores
  // Um acorde começa com uma nota (A-G) seguida opcionalmente de #/b e sufixo
  const tokenRegex = /([A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?(?:\d+)?(?:[#b]\d+)*(?:\/[A-G][#b]?)?)|([^A-G]+|[A-G](?![#b]?(?:maj|min|dim|aug|sus|add|m|M)?(?:\d+)))/g

  // Abordagem mais simples e robusta: substituir tokens de acorde um a um
  return line.replace(/[A-G][#b]?(?:(?:maj|min|dim|aug|sus|add)[\d]*|[mM][\d]*|[\d]+)?(?:[#b][\d]+)*(?:\/[A-G][#b]?)?/g, (match) => {
    return transposeChordSymbol(match, delta, useFlats)
  })
}

/**
 * Transpõe o texto completo de uma cifra de `fromTone` para `toTone`.
 * Apenas linhas que começam com "|" são processadas como linhas de acordes.
 */
export function transposeChordText(text: string, fromTone: string, toTone: string): string {
  if (!fromTone || !toTone || fromTone === toTone) return text

  const delta = semitone_diff(fromTone, toTone)
  const useFlats = preferFlats(toTone)

  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('|')) {
        return '|' + transposeLine(line.substring(1), delta, useFlats)
      }
      return line
    })
    .join('\n')
}
