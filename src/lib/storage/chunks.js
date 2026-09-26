import { createStore, get, set, del, keys, values } from 'idb-keyval'

let customStore = null

function getCustomStore() {
  if (typeof window === 'undefined') return null
  if (!customStore) {
    customStore = createStore('youtube-transcript-chunks', 'chunks')
  }
  return customStore
}

export async function deleteChunksForVideo(videoId) {
  try {
    if (!videoId) return false
    const store = getCustomStore()
    if (!store) return false

    const allKeys = await keys(store)
    if (!Array.isArray(allKeys)) return false

    const prefix = `${videoId}:`
    const keysToDelete = allKeys.filter(
      (k) => typeof k === 'string' && (k === videoId || k.startsWith(prefix))
    )

    for (const key of keysToDelete) {
      await del(key, store)
    }

    return true
  } catch (err) {
    console.error('Error deleting chunks for video from IndexedDB:', err)
    return false
  }
}

export async function saveChunksForVideo(videoId, title, chunks, embeddings) {
  try {
    if (!videoId || !Array.isArray(chunks)) return false
    const store = getCustomStore()
    if (!store) return false

    // Clear old chunks for this video first
    await deleteChunksForVideo(videoId)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const textContent = typeof chunk === 'string' ? chunk : chunk?.pageContent ?? ''
      const key = `${videoId}:${i}`
      const record = {
        id: key,
        videoId,
        title: title || videoId,
        number: i,
        content: textContent,
        embedding: embeddings?.[i] ?? [],
        createdAt: new Date().toISOString(),
      }
      await set(key, record, store)
    }

    return true
  } catch (err) {
    console.error('Error saving chunks for video to IndexedDB:', err)
    return false
  }
}

export async function getAllChunks() {
  try {
    const store = getCustomStore()
    if (!store) return []
    const all = await values(store)
    if (!Array.isArray(all)) return []
    return all
  } catch (err) {
    console.error('Error fetching all chunks from IndexedDB:', err)
    return []
  }
}
