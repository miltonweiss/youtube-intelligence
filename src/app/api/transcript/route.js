import { NextResponse } from 'next/server'
import {
  fetchTranscript,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptInvalidLangError,
} from 'youtube-transcript-plus'
import { checkRateLimit } from '@/lib/rateLimit'

function decodeHTMLEntities(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function normalizeTranscript(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    text: decodeHTMLEntities(item?.text ?? ''),
    duration: typeof item?.duration === 'number' ? item.duration : Number(item?.duration) || 0,
    offset: typeof item?.offset === 'number' ? item.offset : Number(item?.offset) || 0,
    lang: item?.lang,
  }))
}

export async function GET(request) {
  const rateCheck = checkRateLimit(request, { limit: 60, windowMs: 60 * 1000 })
  if (!rateCheck.success) {
    return NextResponse.json(
      { message: `Too many requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
      { status: 429 }
    )
  }

  const url = request.url
  console.log("[API transcript] GET request, url:", url)
  const { searchParams } = new URL(url)
  const videoId = searchParams.get('videoId')
  const lang = searchParams.get('lang') || undefined
  console.log("[API transcript] searchParams videoId:", videoId, "lang:", lang)

  if (!videoId) {
    console.log("[API transcript] missing videoId, returning 400")
    return NextResponse.json({ message: "Missing videoId" }, { status: 400 })
  }

  try {
    console.log("[API transcript] calling fetchTranscript(", videoId, lang ? { lang } : "", ")")
    const options = {
      retries: 2,
      retryDelay: 500,
    }

    let transcript
    if (lang) {
      transcript = await fetchTranscript(videoId, { ...options, lang })
    } else {
      // Prefer English when available; fallback to default first available track
      try {
        transcript = await fetchTranscript(videoId, { ...options, lang: 'en' })
      } catch {
        transcript = await fetchTranscript(videoId, options)
      }
    }

    const normalized = normalizeTranscript(transcript)
    console.log(
      "[API transcript] fetchTranscript result: isArray:",
      Array.isArray(normalized),
      "length:",
      normalized?.length,
      "first item:",
      normalized?.[0]
    )
    return NextResponse.json(normalized, { status: 200 })
  } catch (err) {
    console.error("[API transcript] fetchTranscript error:", err?.message, err)

    let message = "Could not fetch transcript"
    if (err instanceof YoutubeTranscriptVideoUnavailableError) {
      message = `This video is unavailable or private (${videoId})`
    } else if (err instanceof YoutubeTranscriptDisabledError) {
      message = `Transcript is disabled on this video (${videoId})`
    } else if (err instanceof YoutubeTranscriptNotAvailableError) {
      message = `No transcripts are available for this video (${videoId})`
    } else if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
      message = `Transcript is not available in the requested language for video (${videoId})`
    } else if (err instanceof YoutubeTranscriptInvalidLangError) {
      message = `Invalid language requested for video (${videoId})`
    } else if (err?.message) {
      message = err.message
    }

    return NextResponse.json({ message }, { status: 422 })
  }
}
