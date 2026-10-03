import { createYoutubeVideo } from './videos'

async function fetchVideoInfo(videoId) {
  try {
    const res = await fetch(`/api/video-info?videoId=${encodeURIComponent(videoId)}`)
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('[saveToLibrary] Could not fetch video info:', err)
    return null
  }
}

export async function saveToLibrary({ videoId, segments = [], text, playlistId = null }) {
  if (!videoId) return null

  const resolvedText =
    text ||
    (Array.isArray(segments) ? segments.map((item) => item?.text ?? '').join(' ') : '')

  const info = await fetchVideoInfo(videoId)

  return createYoutubeVideo({
    videoId,
    title: info?.title,
    author: info?.author,
    thumbnailUrl: info?.thumbnailUrl,
    segments,
    text: resolvedText,
    playlistId,
  })
}
