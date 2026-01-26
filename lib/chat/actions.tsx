import 'server-only'

import {
  createAI,
  getMutableAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'
import { BotCard, BotMessage, Stock, Purchase } from '@/components/stocks'
import { auth } from '@clerk/nextjs/server'

import { Events } from '@/components/stocks/events'
import { Stocks } from '@/components/stocks/stocks'
import { nanoid } from '@/lib/utils'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { PrismaClient } from '@prisma/client'
import { userData } from "./userData"

const openai = createOpenAI({
  baseURL: 'https://proxy.tune.app',
  apiKey: process.env.TUNE_STUDIO_API_KEY
})

const prisma = new PrismaClient()

async function getUserData(userId: string) {
  const terraData = await prisma.terraData.findMany({
    where: {
      userId: userId,
      type: 'body',
    },
    orderBy: { createdAt: 'desc' },
    take: 1, // Get the most recent entry
  });

  if (terraData.length > 0) {
    return JSON.parse(terraData[0].data);
  }
  return null;
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()
  const session = await auth()
  const metadata = session.sessionClaims?.metadata
  const userRole = session.orgSlug === 'doctor' ? 'doctor' : 'patient'

  // Fetch user data

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('rohan/tune-gpt-4o'),
    initial: <SpinnerMessage />,
    system:
      session.orgSlug === 'doctor'
        ? `You are assisting a doctor like a nurse. Provide technical medical information and treatment suggestions based on this health information: ${JSON.stringify(metadata)}. 
        Today is ${new Date().toDateString()}, use this and the birthday when calculating the patient's age.
        Additionally, here is the most recent health data for the patient: ${JSON.stringify(userData)}
        Only give health advice. Don't do anything else. Be professional and passionate.`
        : `You are assisting a patient like a nurse. Help diagnose any issues or give health advice in summary based on this personal health information: ${JSON.stringify(metadata)}. 
        Today is ${new Date().toDateString()}, use this and the birthday when calculating the patient's age. 
        Additionally, here is your most recent health data: ${JSON.stringify(userData)}
        Only give health advice. Don't do anything else. Be professional and passionate.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
