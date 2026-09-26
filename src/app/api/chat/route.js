import { mistral } from '@ai-sdk/mistral'
import { checkRateLimit } from '@/lib/rateLimit'
import {
  streamText,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  convertToModelMessages,
} from 'ai'

export const maxDuration = 30
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SYSTEM_PROMPT =
  'You are a helpful assistant. Answer based on the provided context. Cite sources as [Source X] when you use them. If the context does not contain relevant information, say so.'

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

function processRagChunks(rawRagChunks) {
  if (!Array.isArray(rawRagChunks) || rawRagChunks.length === 0) {
    return { context: '', chunks: [] }
  }

  const RAG_MAX_CONTEXT_CHARS = 6000
  const validChunks = rawRagChunks
    .slice(0, 5)
    .filter((c) => c && typeof c === 'object' && typeof c.text === 'string' && c.text.trim())
    .map((c, i) => ({
      id: String(c.id || `chunk-${i}`),
      title: typeof c.title === 'string' ? c.title : undefined,
      text: c.text.trim(),
      score: typeof c.score === 'number' ? c.score : 0,
    }))

  if (validChunks.length === 0) {
    return { context: '', chunks: [] }
  }

  let body = validChunks
    .map(
      (c, i) =>
        `[Source ${i + 1}]${c.title ? `\nTitle: ${c.title}` : ''}\n${c.text}`
    )
    .join('\n\n---\n\n')

  if (body.length > RAG_MAX_CONTEXT_CHARS) {
    body = body.slice(0, RAG_MAX_CONTEXT_CHARS) + '\n\n[TRUNCATED]'
  }

  const ragContext = `Use the following sources to answer. Cite as [Source X] when used. If none are relevant, say so.\n\n${body}`

  return { context: ragContext, chunks: validChunks }
}

export async function POST(request) {
  try {
    const rateCheck = checkRateLimit(request, { limit: 20, windowMs: 60 * 1000 })
    if (!rateCheck.success) {
      return Response.json(
        { error: `Too many requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { messages = [], ragChunks: rawRagChunks = [] } = body

    if (!Array.isArray(messages)) {
      return Response.json({ error: 'messages must be an array' }, { status: 400 })
    }

    const validRoles = new Set(['user', 'assistant', 'system', 'tool'])
    const uiMessages = (messages || []).filter(
      (m) => m && typeof m === 'object' && validRoles.has(m.role)
    )

    const lastUserIndex = [...uiMessages].map((m) => m.role).lastIndexOf('user')
    const lastUserMessage = lastUserIndex >= 0 ? uiMessages[lastUserIndex] : null

    const { context: ragContext, chunks: ragChunks } = processRagChunks(rawRagChunks)

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
          model: mistral('mistral-small-latest'),
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
