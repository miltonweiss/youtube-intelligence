/**
 * Shared embedding logic using Mistral AI.
 * Used for embedding query text or transcript chunks.
 */
import { mistral } from '@ai-sdk/mistral'
import { embedMany } from 'ai'

const EMBEDDING_MODEL = mistral.textEmbeddingModel('mistral-embed')

/**
 * Get a single embedding for a query string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedQuery(text) {
  if (!text || typeof text !== 'string') return []
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: [text.trim()],
  })
  return embeddings?.[0] ?? []
}

/**
 * Embed an array of text strings and return a matching array of embedding vectors.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return []
  const values = texts.map((t) => (typeof t === 'string' ? t : t.pageContent ?? '').trim())
  const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values })
  return embeddings ?? []
}
