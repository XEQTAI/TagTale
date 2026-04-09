import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ObjectHeader from '@/components/object/ObjectHeader'
import FeedList from '@/components/feed/FeedList'

async function getObject(id: string, userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/objects/${id}`, {
    headers: { Cookie: `session=${userId}` }, // session cookie forwarded server-side
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function ObjectPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  // Object detail is fetched client-side via ObjectHeader to pass session cookie properly
  return (
    <div>
      <ObjectHeader objectId={params.id} />
      {session && <FeedList objectId={params.id} userId={session.userId} />}
    </div>
  )
}
