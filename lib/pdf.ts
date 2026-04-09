/**
 * PDF generation for TagTale QR cards.
 * Uses pdf-lib (pure JS, no puppeteer, no headless browser — zero extra cost).
 *
 * Layout (A5 portrait):
 *   Header    — "TagTale" wordmark + tagline
 *   Object    — photo (if any) + name + description
 *   QR code   — centered, large
 *   How-to    — 3-step instructions
 *   Sponsor   — logo + name (if applicable)
 *   Footer    — URL + branding
 */
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'

const W = 419.53  // A5 width  (mm → pt)
const H = 595.28  // A5 height

const BLACK  = rgb(0, 0, 0)
const DGRAY  = rgb(0.25, 0.25, 0.25)
const MGRAY  = rgb(0.55, 0.55, 0.55)
const LGRAY  = rgb(0.85, 0.85, 0.85)
const WHITE  = rgb(1, 1, 1)

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
  maxWidth?: number
) {
  if (!text) return
  let display = text
  if (maxWidth) {
    // Simple truncation (pdf-lib doesn't wrap)
    while (font.widthOfTextAtSize(display, size) > maxWidth && display.length > 4) {
      display = display.slice(0, -4) + '...'
    }
  }
  page.drawText(display, { x, y, font, size, color })
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: LGRAY })
}

export async function generateQrPdf(params: {
  objectId: string
  objectName: string
  objectDescription?: string | null
  qrDataUrl: string          // PNG data URL
  objectImageUrl?: string | null  // object photo URL or data URL
  sponsorName?: string | null
  sponsorLogoUrl?: string | null
  baseUrl?: string
}): Promise<Uint8Array> {
  const doc   = await PDFDocument.create()
  const page  = doc.addPage([W, H])
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg   = await doc.embedFont(StandardFonts.Helvetica)
  const light = await doc.embedFont(StandardFonts.Helvetica)

  const pad  = 32
  let   curY = H - pad

  // ── Header ──────────────────────────────────────────────────────────────
  // Black bar at top
  page.drawRectangle({ x: 0, y: H - 48, width: W, height: 48, color: BLACK })

  // "TagTale" wordmark
  page.drawText('Tag', { x: pad, y: H - 34, font: light, size: 22, color: WHITE })
  const tagW = light.widthOfTextAtSize('Tag', 22)
  page.drawText('Tale', { x: pad + tagW, y: H - 34, font: bold, size: 22, color: WHITE })

  // Tagline
  const tagline = 'Stories travel with objects'
  const tW = reg.widthOfTextAtSize(tagline, 8.5)
  page.drawText(tagline, { x: W - pad - tW, y: H - 34, font: reg, size: 8.5, color: rgb(0.7, 0.7, 0.7) })

  curY = H - 48 - 20

  // ── Object photo (if available) ──────────────────────────────────────────
  const imgAreaH = 130
  let   hasPhoto = false

  if (params.objectImageUrl) {
    try {
      let imgBytes: ArrayBuffer
      if (params.objectImageUrl.startsWith('data:')) {
        const b64 = params.objectImageUrl.split(',')[1]
        imgBytes = Buffer.from(b64, 'base64').buffer
      } else {
        const r = await fetch(params.objectImageUrl)
        imgBytes = await r.arrayBuffer()
      }
      const img = params.objectImageUrl.includes('jpeg') || params.objectImageUrl.includes('jpg')
        ? await doc.embedJpg(imgBytes)
        : await doc.embedPng(imgBytes)

      const ratio = img.width / img.height
      const imgW  = Math.min(W - pad * 2, imgAreaH * ratio)
      const imgH  = imgW / ratio

      page.drawImage(img, {
        x: (W - imgW) / 2,
        y: curY - imgH,
        width:  imgW,
        height: imgH,
      })
      curY -= imgH + 12
      hasPhoto = true
    } catch { /* skip photo on error */ }
  }

  if (!hasPhoto) curY -= 8

  // ── Object name + description ────────────────────────────────────────────
  const nameSize = 18
  const nameW    = bold.widthOfTextAtSize(params.objectName, nameSize)
  page.drawText(params.objectName, {
    x: (W - Math.min(nameW, W - pad * 2)) / 2,
    y: curY,
    font: bold,
    size: nameSize,
    color: BLACK,
  })
  curY -= nameSize + 6

  if (params.objectDescription) {
    const descLines = wrapText(params.objectDescription, reg, 10, W - pad * 2)
    for (const line of descLines.slice(0, 3)) {
      const lW = reg.widthOfTextAtSize(line, 10)
      page.drawText(line, { x: (W - lW) / 2, y: curY, font: reg, size: 10, color: DGRAY })
      curY -= 14
    }
  }

  curY -= 12
  drawLine(page, pad, curY, W - pad, curY)
  curY -= 20

  // ── QR code ──────────────────────────────────────────────────────────────
  try {
    const b64    = params.qrDataUrl.split(',')[1]
    const pngBytes = Buffer.from(b64, 'base64')
    const qrImg  = await doc.embedPng(pngBytes)
    const qrSize = 160

    page.drawImage(qrImg, {
      x: (W - qrSize) / 2,
      y: curY - qrSize,
      width: qrSize,
      height: qrSize,
    })
    curY -= qrSize + 10
  } catch { curY -= 12 }

  // Scan URL
  const scanUrl = `${params.baseUrl || 'tagtale.app'}/object/${params.objectId}/scan`
  const urlW    = reg.widthOfTextAtSize(scanUrl, 8)
  page.drawText(scanUrl, { x: (W - urlW) / 2, y: curY, font: reg, size: 8, color: MGRAY })
  curY -= 22

  drawLine(page, pad, curY, W - pad, curY)
  curY -= 18

  // ── How-to ────────────────────────────────────────────────────────────────
  const htTitle = 'HOW TO USE'
  const htTW    = bold.widthOfTextAtSize(htTitle, 9)
  page.drawText(htTitle, { x: (W - htTW) / 2, y: curY, font: bold, size: 9, color: MGRAY })
  curY -= 16

  const steps = ['Open your phone camera', 'Point at the QR code above', 'Sign in and share your story']
  steps.forEach((step, i) => {
    // Numbered circle
    page.drawCircle({ x: pad + 8, y: curY + 4, size: 8, color: BLACK })
    page.drawText(String(i + 1), { x: pad + 5.5, y: curY + 0.5, font: bold, size: 7.5, color: WHITE })
    page.drawText(step, { x: pad + 22, y: curY, font: reg, size: 9.5, color: DGRAY })
    curY -= 16
  })

  curY -= 8
  drawLine(page, pad, curY, W - pad, curY)
  curY -= 14

  // ── Sponsor ───────────────────────────────────────────────────────────────
  if (params.sponsorName) {
    const sLabel = `Presented by  ${params.sponsorName}`
    const sW     = reg.widthOfTextAtSize(sLabel, 9)
    page.drawText(sLabel, { x: (W - sW) / 2, y: curY, font: reg, size: 9, color: MGRAY })
    curY -= 14
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = 'tagtale.app  ·  Every object has a story'
  const fW     = reg.widthOfTextAtSize(footer, 7.5)
  page.drawText(footer, { x: (W - fW) / 2, y: pad, font: reg, size: 7.5, color: LGRAY })

  return doc.save()
}

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let   cur   = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(test, size) > maxW) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}
