/**
 * Geração de PDF com pdf-lib.
 * Exporta a folha de cifra de uma ou todas as músicas da setlist.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { SetlistItem } from '../types'
import { transposeChordText } from './transpose'

const PAGE_W = 595  // A4 points
const PAGE_H = 842

const MARGIN = 40
const LINE_H = 14

interface PDFSheetInput {
  item: SetlistItem
  chordText: string
}

async function buildDoc(sheets: PDFSheetInput[]): Promise<PDFDocument> {
  const doc = await PDFDocument.create()
  const fontMono  = await doc.embedFont(StandardFonts.Courier)
  const fontBold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  for (const { item, chordText } of sheets) {
    const page = doc.addPage([PAGE_W, PAGE_H])
    let y = PAGE_H - MARGIN

    // ── Header ─────────────────────────────────────────────
    page.drawText(item.songTitle || '—', {
      x: MARGIN, y,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    y -= 20

    page.drawText(`${item.artist || ''}`, {
      x: MARGIN, y,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    })

    const rightInfo = [item.tom && `Tom: ${item.tom}`, item.bpm && `BPM: ${item.bpm}`]
      .filter(Boolean).join('  |  ')
    if (rightInfo) {
      const w = fontRegular.widthOfTextAtSize(rightInfo, 11)
      page.drawText(rightInfo, {
        x: PAGE_W - MARGIN - w, y,
        size: 11,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      })
    }
    y -= 6

    // Linha divisória
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })
    y -= 14

    // ── OBS ────────────────────────────────────────────────
    if (item.obs) {
      page.drawText(`OBS: ${item.obs}`, {
        x: MARGIN, y,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.4, 0.6),
      })
      y -= LINE_H + 4
    }

    // ── Cifra ──────────────────────────────────────────────
    const transposed = item.tom
      ? chordText
      : chordText

    const lines = transposed.split('\n')
    for (const line of lines) {
      if (y < MARGIN + 60) {
        // Nova página
        const np = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
        // eslint-disable-next-line no-param-reassign
        Object.assign(page, np)
        break
      }
      const isChordLine = line.startsWith('|')
      const displayLine = isChordLine ? line.substring(1) : line
      page.drawText(displayLine, {
        x: MARGIN, y,
        size: 10,
        font: isChordLine ? fontBold : fontMono,
        color: isChordLine ? rgb(0.1, 0.1, 0.7) : rgb(0, 0, 0),
      })
      y -= LINE_H
    }

    // ── PREPARAÇÃO ─────────────────────────────────────────
    if (item.preparacao) {
      y -= 8
      page.drawText(`PREPARAÇÃO: ${item.preparacao}`, {
        x: MARGIN, y,
        size: 10,
        font: fontRegular,
        color: rgb(0.6, 0.2, 0.2),
      })
    }
  }

  return doc
}

export async function exportSheetPDF(input: PDFSheetInput): Promise<void> {
  const doc = await buildDoc([input])
  const bytes = await doc.save()
  downloadPDF(bytes, `${input.item.songTitle || 'cifra'}.pdf`)
}

export async function exportSetlistPDF(sheets: PDFSheetInput[]): Promise<void> {
  const doc = await buildDoc(sheets)
  const bytes = await doc.save()
  downloadPDF(bytes, 'setlist.pdf')
}

function downloadPDF(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
