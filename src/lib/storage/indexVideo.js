import { createYoutubeVideo } from './videos'
import { saveChunksForVideo } from './chunks'
import { splitTextFromString } from '@/lib/langchain/textSplit'

let queue = Promise.resolve()

async function processIndexing({ videoId, name, text }) {
  if (!videoId || !text) return null

  // Step 1: Save full video transcript
  const video = await createYoutubeVideo({ videoId, name: name || videoId, text })
  if (!video) return null

  // Step 2: Split text into chunks
  const chunks = await splitTextFromString(text)
  if (!chunks || chunks.length === 0) return 0

  const chunkTexts = chunks.map((c) => (typeof c === 'string' ? c : c.pageContent))

  // Step 3: Call embed API in batches of at most 50 to respect limits
  const BATCH_SIZE = 50
  const allEmbeddings = []

  for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + BATCH_SIZE)
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: batch }),
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      console.error('[indexVideo] Embedding failed:', errJson?.error || res.statusText)
      return null
    }

    const data = await res.json()
    if (Array.isArray(data.embeddings)) {
      allEmbeddings.push(...data.embeddings)
    }
  }

  // Step 4: Save chunks and embeddings in IndexedDB
  const success = await saveChunksForVideo(videoId, name || videoId, chunks, allEmbeddings)
  if (!success) return null

  return chunks.length
}

export function indexVideo({ videoId, name, text }) {
  // Queue execution sequentially
  const nextTask = queue.then(() => processIndexing({ videoId, name, text }))
  queue = nextTask.catch(() => {}) // keep queue running even if individual task fails
  return nextTask
}
