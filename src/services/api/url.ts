const PATHNAME_BASE = 'http://localhost'

const normalizePathname = (value: string): string => {
  const pathname = new URL(value, PATHNAME_BASE).pathname
  const normalized = pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '')

  return normalized || '/'
}

const normalizeRelativeUrl = (url: string): string => {
  if (url.startsWith('/')) return url
  if (url.startsWith('?') || url.startsWith('#')) return `/${url}`
  return `/${url}`
}

export const resolveRequestUrl = (url: string, baseUrl: string): string => {
  if (!url) return baseUrl
  if (/^https?:\/\//i.test(url)) return url

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const normalizedBasePathname = normalizePathname(baseUrl)
  const normalizedUrl = normalizeRelativeUrl(url)
  const normalizedUrlPathname = normalizePathname(normalizedUrl)

  if (
    normalizedUrlPathname.startsWith('/sanctum') ||
    normalizedUrlPathname.startsWith('/storage')
  ) {
    return normalizedUrl
  }

  if (normalizedUrlPathname.startsWith('/api/')) {
    return normalizedUrl
  }

  if (
    normalizedUrlPathname === normalizedBasePathname ||
    normalizedUrlPathname.startsWith(`${normalizedBasePathname}/`)
  ) {
    return normalizedUrl
  }

  return `${normalizedBaseUrl}/${normalizedUrl.replace(/^\//, '')}`
}
