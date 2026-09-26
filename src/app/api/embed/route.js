import { embedTexts } from '@/lib/ai/embedding'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req) {
  try {
    const rateCheck = checkRateLimit(req, { limit: 30, windowMs: 60 * 1000 })
    if (!rateCheck.success) {
      return Response.json(
        { error: `Too many requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      )
    }

    const { values } = await req.json()

    if (!values || !Array.isArray(values)) {
      return Response.json(
        { error: 'Invalid input: values must be an array' },
        { status: 400 }
      )
    }

    if (values.length > 100) {
      return Response.json(
        { error: 'Too many items: maximum 100 values per embedding request' },
        { status: 400 }
      )
    }

    // Sanitize and limit length per value (max 2000 chars)
    const sanitizedValues = values.map((chunk) => {
      const text = typeof chunk === 'string' ? chunk : chunk?.pageContent ?? ''
      return text.slice(0, 2000)
    })

    const embeddings = await embedTexts(sanitizedValues)

    return Response.json({ embeddings })
  } catch (error) {
    console.error('Embedding error:', error)
    return Response.json(
      { error: error.message || 'An error occurred during embedding' },
      { status: 500 }
    )
  }
}
