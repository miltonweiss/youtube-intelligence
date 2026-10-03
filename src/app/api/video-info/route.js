import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request) {
  const rateCheck = checkRateLimit(request, { limit: 60, windowMs: 60 * 1000 })
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId || !/^[A-Za-z0-9_-]{6,15}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid or missing videoId' }, { status: 400 })
  }

  const fallbackThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(oembedUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!res.ok) {
      return NextResponse.json({
        videoId,
        title: videoId,
        author: '',
        thumbnailUrl: fallbackThumbnail,
      })
    }

    const data = await res.json()
    return NextResponse.json({
      videoId,
      title: data.title || videoId,
      author: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || fallbackThumbnail,
    })
  } catch (err) {
    console.warn('[API video-info] Failed to fetch oEmbed:', err?.message)
    return NextResponse.json({
      videoId,
      title: videoId,
      author: '',
      thumbnailUrl: fallbackThumbnail,
    })
  }
}
