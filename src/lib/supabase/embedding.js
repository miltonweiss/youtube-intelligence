/**
 * Shared embedding logic – same model and approach as /api/embed.
 * Used by RAG to embed the user query and by findRelevantContent for retrieval.
 */
import { openai } from '@ai-sdk/openai'
import { embedMany } from 'ai'

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small')

/**
 * Get a single embedding for a query string (same as embed API uses for chunks).
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

/**
 * @param {string} queryText
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ topK?: number }} [options]
 * @returns {Promise<Array<{ id: string, text: string, similarity: number, metadata?: object }>>}
 */
export async function findRelevantContent(queryText, supabaseClient, options = {}) {
  const topK = options.topK ?? 5
  if (!queryText?.trim()) return []

  const queryEmbedding = await embedQuery(queryText)
  if (!queryEmbedding.length) throw new Error('[RAG] Failed to embed query')

  const { data, error } = await supabaseClient.rpc('match_youtube_videos_chunks', {
    query_embedding: queryEmbedding,
    match_count: topK,
  })

  if (error) throw new Error(`[RAG] RPC error: ${error.message}`)
  if (!Array.isArray(data) || data.length === 0) return []

  return data.map((row) => ({
    id: String(row.id ?? ''),
    text: String(row.content ?? ''),
    similarity: Number(row.similarity ?? 0),
    title: row.name ?? undefined,
    metadata: {
      title: row.name ?? undefined,
      chunkNumber: row.chunks_number ?? undefined,
      dateAdded: row.date_Added ?? undefined,
    },
  }))
}
