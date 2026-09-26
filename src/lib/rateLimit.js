const ipMap = new Map()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, data] of ipMap.entries()) {
      if (now > data.resetTime) {
        ipMap.delete(ip)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Check in-memory rate limit for a request.
 * @param {Request} req
 * @param {{ limit?: number, windowMs?: number }} options
 * @returns {{ success: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(req, options = {}) {
  const limit = options.limit ?? 20
  const windowMs = options.windowMs ?? 60 * 1000 // 1 minute default

  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1'

  const now = Date.now()
  const current = ipMap.get(ip)

  if (!current || now > current.resetTime) {
    ipMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000) }
  }

  if (current.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((current.resetTime - now) / 1000))
    return { success: false, remaining: 0, resetInSeconds }
  }

  current.count += 1
  const resetInSeconds = Math.max(1, Math.ceil((current.resetTime - now) / 1000))
  return { success: true, remaining: limit - current.count, resetInSeconds }
}
