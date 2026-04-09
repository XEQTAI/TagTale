import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateQrCode, generatePrintableQrCard } from '@/lib/qr'
import { trackEvent } from '@/lib/analytics'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: objectId } = params
    const format = req.nextUrl.searchParams.get('format') || 'png'

    const object = await prisma.tagObject.findUnique({
      where: { id: objectId },
      include: { sponsor: true },
    })
    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    if (format === 'print') {
      const html = await generatePrintableQrCard(
        objectId,
        object.name,
        object.sponsor?.name,
        object.sponsor?.logoUrl ?? undefined
      )
      await trackEvent('qr_print', { userId: session.userId, objectId })
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Regenerate and update QR code
    const qrDataUrl = await generateQrCode(objectId)
    await prisma.tagObject.update({ where: { id: objectId }, data: { qrCodeUrl: qrDataUrl } })

    await trackEvent('qr_generate', { userId: session.userId, objectId })

    return NextResponse.json({ qrCodeUrl: qrDataUrl, objectId })
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
