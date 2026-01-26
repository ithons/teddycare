import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { getMissingKeys } from '@/app/actions'

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Chat with Teddy'
}

export default async function IndexPage() {
  const id = nanoid()
  //const missingKeys = await getMissingKeys()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} missingKeys={[]} />
    </AI>
  )
}
