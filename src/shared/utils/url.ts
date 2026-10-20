const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

export const isSafeUrl = (url: string | null | undefined): boolean => {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

export const safeUrl = (url: string | null | undefined, fallback = '#'): string => {
  return isSafeUrl(url) ? (url as string) : fallback
}
