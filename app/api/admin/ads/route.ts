import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireAdmin } from '@/lib/auth'
import { httpStatusFromAuthError } from '@/lib/http-status'
import { z } from 'zod'

const campaignSchema = z.object({
  type: z.literal('campaign'),
  sponsorId: z.string(),
  name: z.string().min(1),
  budget: z.number().optional(),
  cpm: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const adSchema = z.object({
  type: z.literal('ad'),
  sponsorId: z.string().optional(),
  campaignId: z.string().optional(),
  title: z.string().min(1),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  cpm: z.number().optional(),
})

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['draft', 'active', 'paused', 'ended']).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const campaigns = await prisma.adCampaign.findMany({
      include: {
        sponsor: { select: { id: true, name: true, logoUrl: true } },
        ads: {
          include: { _count: { select: { impressions: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Total impressions and spend summary
    const totals = await prisma.adImpression.aggregate({ _count: { id: true } })
    const activeAds = await prisma.ad.count({ where: { isActive: true } })

    return NextResponse.json({ campaigns, totals: { impressions: totals._count.id, activeAds } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()

    if (body.type === 'campaign') {
      const { type: _, startDate, endDate, ...rest } = campaignSchema.parse(body)
      const campaign = await prisma.adCampaign.create({
        data: {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate:   endDate   ? new Date(endDate)   : undefined,
        },
      })
      return NextResponse.json(campaign, { status: 201 })
    }

    if (body.type === 'ad') {
      const { type: _, ...data } = adSchema.parse(body)
      const ad = await prisma.ad.create({ data })
      return NextResponse.json(ad, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req)
    requireAdmin(session)

    const body = await req.json()
    const { id, ...data } = patchSchema.parse(body)

    // Could be campaign or ad — try both
    if (data.status) {
      const c = await prisma.adCampaign.update({ where: { id }, data: { status: data.status } }).catch(() => null)
      if (c) return NextResponse.json(c)
    }
    if (typeof data.isActive === 'boolean') {
      const a = await prisma.ad.update({ where: { id }, data: { isActive: data.isActive } }).catch(() => null)
      if (a) return NextResponse.json(a)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: httpStatusFromAuthError(msg) })
  }
}
