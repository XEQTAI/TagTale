import { getSession } from '@/lib/auth'
import FeedList from '@/components/feed/FeedList'

export default async function FeedPage() {
  const session = await getSession()

  return (
    <div className="feed-container px-0 sm:px-4 py-5">
      <FeedList userId={session!.userId} />
    </div>
  )
}
