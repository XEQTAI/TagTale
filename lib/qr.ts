import QRCode from 'qrcode'
import { generateQrScanUrl } from './utils'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3333'

export interface QrCodeOptions {
  width?: number
  margin?: number
  color?: { dark: string; light: string }
  logo?: string
}

export async function generateQrCode(objectId: string, options: QrCodeOptions = {}): Promise<string> {
  const url = generateQrScanUrl(BASE_URL, objectId)

  const opts: QRCode.QRCodeToDataURLOptions = {
    type: 'image/png',
    width: options.width || 400,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // High error correction for logo overlay
  }

  const dataUrl = await QRCode.toDataURL(url, opts)
  return dataUrl
}

export async function generateQrCodeSvg(objectId: string, options: QrCodeOptions = {}): Promise<string> {
  const url = generateQrScanUrl(BASE_URL, objectId)

  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: options.width || 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  })

  return svg
}

// Generate print-ready QR card with branding
export async function generatePrintableQrCard(
  objectId: string,
  objectName: string,
  sponsorName?: string,
  sponsorLogo?: string,
): Promise<string> {
  const qrDataUrl = await generateQrCode(objectId, { width: 600 })
  const scanUrl = generateQrScanUrl(BASE_URL, objectId)

  const sponsorSection = sponsorName
    ? `<div style="margin-top: 8px; font-size: 11px; color: #6b7280;">Sponsored by ${sponsorName}</div>`
    : ''

  // Return HTML that can be printed
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>TagTale QR - ${objectName}</title>
        <style>
          @media print { body { margin: 0; } }
          body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
          .card { width: 300px; padding: 24px; border: 2px solid #e5e7eb; border-radius: 16px; text-align: center; }
          .brand { font-size: 18px; font-weight: 800; color: #c026d3; margin-bottom: 8px; }
          .object-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 16px; }
          .qr { width: 200px; height: 200px; }
          .url { font-size: 10px; color: #9ca3af; margin-top: 12px; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">TagTale</div>
          <div class="object-name">${objectName}</div>
          <img src="${qrDataUrl}" alt="QR Code" class="qr" />
          <div class="url">${scanUrl}</div>
          ${sponsorSection}
        </div>
      </body>
    </html>
  `
}
