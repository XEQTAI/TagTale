import { PrismaClient } from '@prisma/client'
import { generateAvatarUrl } from '../lib/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tagtale.app' },
    update: {},
    create: {
      email: 'admin@tagtale.app',
      username: 'admin',
      avatarUrl: generateAvatarUrl('admin'),
      isAdmin: true,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // Create sponsor
  const sponsor = await prisma.sponsor.upsert({
    where: { name: 'ZippoLighters' },
    update: {},
    create: {
      name: 'ZippoLighters',
      logoUrl: 'https://placehold.co/200x80/gold/black?text=Zippo',
      websiteUrl: 'https://zippo.com',
      isActive: true,
    },
  })
  console.log(`✅ Sponsor: ${sponsor.name}`)

  // Create a few demo objects
  const objects = [
    {
      name: 'Zippo Lighter #001',
      description: 'A classic brushed chrome lighter — where has it traveled?',
      sponsorId: sponsor.id,
    },
    {
      name: 'Community Garden Gnome',
      description: 'The beloved gnome of Maple Street Community Garden.',
      sponsorId: null,
    },
    {
      name: 'Rare Pokémon Card',
      description: '1st Edition Charizard — scan to see its journey.',
      sponsorId: null,
    },
  ]

  for (const obj of objects) {
    const created = await prisma.tagObject.upsert({
      where: { id: `seed-${obj.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${obj.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: obj.name,
        description: obj.description,
        sponsorId: obj.sponsorId,
        createdById: admin.id,
      },
    })
    console.log(`✅ Object: ${created.name}`)
  }

  // Create an ad
  await prisma.ad.upsert({
    where: { id: 'seed-ad-1' },
    update: {},
    create: {
      id: 'seed-ad-1',
      title: 'TagTale Premium — coming soon',
      imageUrl: 'https://placehold.co/600x200/7c3aed/white?text=TagTale+Premium',
      linkUrl: 'https://tagtale.app',
      isActive: true,
    },
  })
  console.log('✅ Ad created')

  console.log('\n🎉 Seed complete!')
  console.log('\nAdmin login: admin@tagtale.app')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
