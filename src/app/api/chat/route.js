import { openai } from '@ai-sdk/openai'
import {
  streamText,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  convertToModelMessages,
} from 'ai'
import { createClient } from '@supabase/supabase-js'
import { findRelevantContent } from '@/lib/supabase/embedding'

export const maxDuration = 30
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * RAG tuning
 */
const RAG_TOP_K = 3
const RAG_MIN_SIMILARITY = 0.3
const RAG_MAX_CONTEXT_CHARS = 6_000

const SYSTEM_PROMPT =
  'You are a helpful assistant. Answer based on the provided context. Cite sources as [Source X] when you use them. If the context does not contain relevant information, say so.'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

function getUserMessageText(message) {
  if (!message || typeof message !== 'object') return ''

  if (Array.isArray(message.parts)) {
    const partsText = message.parts
      .filter((part) => part?.type === 'text')
      .map((part) => part?.text ?? '')
      .join(' ')
      .trim()
    if (partsText) return partsText
  }

  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content.map((c) => c?.text ?? '').join(' ').trim()
  }
  if (typeof message.text === 'string') return message.text

  return ''
}

async function retrieveContext(userText) {
  const context = ''
  const chunks = []

  if (!(userText ?? '').trim()) return { context, chunks }

  let results
  try {
    results = await findRelevantContent(userText, supabase, { topK: RAG_TOP_K })
  } catch (err) {
    console.error('[RAG] Retrieval failed', err)
    return { context, chunks }
  }

  if (!results?.length) return { context, chunks }

  const beforeFilter = results.map((r) => ({
    text: r.text ?? r.content ?? r.metadata?.text ?? '',
    score: Number(r.similarity ?? r.score ?? 0),
    id: r.id ?? r.metadata?.id ?? r.metadata?.documentId ?? '',
    title: r.title ?? r.metadata?.title ?? undefined,
  }))

  const filteredChunks = beforeFilter
    .filter((c) => c.score >= RAG_MIN_SIMILARITY && (c.text ?? '').trim().length > 0)

  if (!filteredChunks.length) return { context, chunks }

  let body = filteredChunks
    .map(
      (c, i) =>
        `[Source ${i + 1}]${c.title ? `\nTitle: ${c.title}` : ''}\n${c.text}`
    )
    .join('\n\n---\n\n')

  if (body.length > RAG_MAX_CONTEXT_CHARS) {
    body = body.slice(0, RAG_MAX_CONTEXT_CHARS) + '\n\n[TRUNCATED]'
  }

  const ragContext =
    `Use the following sources to answer. Cite as [Source X] when used. If none are relevant, say so.\n\n${body}`

  return { context: ragContext, chunks: filteredChunks }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages = [] } = body

    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages must be an array' }, { status: 400 })
    }

    const validRoles = new Set(['user', 'assistant', 'system', 'tool'])
    const uiMessages = (messages || []).filter(
      (m) => m && typeof m === 'object' && validRoles.has(m.role)
    )

    const lastUserIndex = [...uiMessages].map((m) => m.role).lastIndexOf('user')
    const lastUserMessage = lastUserIndex >= 0 ? uiMessages[lastUserIndex] : null
    const userText = lastUserMessage ? getUserMessageText(lastUserMessage) : ''

    const { context: ragContext, chunks: ragChunks } = await retrieveContext(userText)

    const historyUiMessages = lastUserIndex >= 0 ? uiMessages.slice(0, lastUserIndex) : uiMessages
    const [historyMessages, latestUserMessages] = await Promise.all([
      convertToModelMessages(historyUiMessages),
      lastUserMessage ? convertToModelMessages([lastUserMessage]) : Promise.resolve([]),
    ])

    const finalMessages = [{ role: 'system', content: SYSTEM_PROMPT }]
    finalMessages.push(...historyMessages)
    if (ragContext) {
      finalMessages.push({ role: 'system', content: ragContext })
    }
    finalMessages.push(...latestUserMessages)

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({
          type: 'data-rag_context',
          id: generateId(),
          data: {
            chunks: ragChunks.map((c, i) => ({
              source: i + 1,
              score: c.score,
              id: c.id,
              title: c.title,
              preview: c.text.length > 1000 ? c.text.substring(0, 500) + '...' : c.text,
            })),
          },
        })

        const result = streamText({
          model: openai('gpt-4.1-mini'),
          temperature: 0.2,
          maxOutputTokens: 900,
          messages: finalMessages,
        })

        writer.merge(result.toUIMessageStream())
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error('[RAG] Request error', error?.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
