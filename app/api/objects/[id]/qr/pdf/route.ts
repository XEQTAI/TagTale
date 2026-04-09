import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateQrCode } from '@/lib/qr'
import { generateQrPdf } from '@/lib/pdf'
import { trackEvent } from '@/lib/analytics'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: objectId } = params

    const object = await prisma.tagObject.findUnique({
      where: { id: objectId },
      include: { sponsor: true },
    })
    if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    const qrDataUrl = object.qrCodeUrl ?? (await generateQrCode(objectId))

    const pdfBytes = await generateQrPdf({
      objectId,
      objectName:        object.name,
      objectDescription: object.description,
      qrDataUrl,
      objectImageUrl:    object.imageUrl,
      sponsorName:       object.sponsor?.name,
      sponsorLogoUrl:    object.sponsor?.logoUrl,
      baseUrl:           process.env.NEXT_PUBLIC_BASE_URL,
    })

    await trackEvent('qr_pdf_download', { userId: session.userId, objectId })

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tagtale-${objectId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
