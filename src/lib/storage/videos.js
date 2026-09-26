import { createStore, get, set, del, values } from 'idb-keyval'

let customStore = null

function getCustomStore() {
  if (typeof window === 'undefined') return null
  if (!customStore) {
    customStore = createStore('youtube-transcript', 'videos')
  }
  return customStore
}

export async function getYoutubeVideos() {
  try {
    const store = getCustomStore()
    if (!store) return []
    const allVideos = await values(store)
    if (!Array.isArray(allVideos)) return []
    return allVideos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } catch (err) {
    console.error('Error fetching Youtube Videos from IndexedDB:', err)
    return []
  }
}

export async function getSpecificYoutubeVideo(id) {
  try {
    if (!id) return null
    const store = getCustomStore()
    if (!store) return null
    const video = await get(id, store)
    return video || null
  } catch (err) {
    console.error('Error fetching Youtube Video from IndexedDB:', err)
    return null
  }
}

export async function createYoutubeVideo(video) {
  try {
    const store = getCustomStore()
    if (!store) return null
    const videoId = video.videoId || video.id || video.name
    if (!videoId) return null

    const record = {
      id: videoId,
      videoId: videoId,
      name: video.name || videoId,
      text: video.text || video.fileContent || '',
      createdAt: new Date().toISOString(),
    }

    await set(videoId, record, store)
    return record
  } catch (err) {
    console.error('Exception creating Youtube Video in IndexedDB:', err)
    return null
  }
}

export async function updateYoutubeVideo(id, updates) {
  try {
    if (!id) return null
    const store = getCustomStore()
    if (!store) return null
    const existing = await get(id, store)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await set(id, updated, store)
    return updated
  } catch (err) {
    console.error('Error updating Youtube Video in IndexedDB:', err)
    return null
  }
}

export async function deleteYoutubeVideo(id) {
  try {
    if (!id) return false
    const store = getCustomStore()
    if (!store) return false
    await del(id, store)
    return true
  } catch (err) {
    console.error('Error deleting Youtube Video from IndexedDB:', err)
    return false
  }
}
