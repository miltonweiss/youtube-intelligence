import { getAllChunks } from '../storage/chunks'

function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || vecA.length === 0) {
    return 0
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function retrieveChunks(question, options = {}) {
  const topK = options.topK ?? 3
  const minScore = options.minScore ?? 0.2

  if (!question || typeof question !== 'string' || !question.trim()) {
    return []
  }

  // Fetch all chunks from IndexedDB
  const chunks = await getAllChunks()
  if (!chunks || chunks.length === 0) return []

  // Get embedding vector for question via /api/embed
  const res = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [question.trim()] }),
  })

  if (!res.ok) {
    console.error('[retrieve] Failed to embed query:', res.statusText)
    return []
  }

  const data = await res.json()
  const queryEmbedding = data.embeddings?.[0]
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return []
  }

  // Calculate similarity for all stored chunks
  const scored = chunks
    .map((c) => {
      const score = cosineSimilarity(queryEmbedding, c.embedding)
      return {
        id: c.id,
        title: c.title,
        text: c.content,
        score,
      }
    })
    .filter((item) => item.score >= minScore && item.text?.trim()?.length > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topK)
}
