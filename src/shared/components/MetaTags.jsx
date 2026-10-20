import { Helmet } from 'react-helmet-async'

const DEFAULT_DESCRIPTION =
  'Septentrional — Actualités du Togo, politique, société, culture et informations des régions.'

const INDEXABLE_QUERY_PARAMS = new Set(['page'])

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeTitle = (value) => {
  const title = stripHtml(value)
    .replace(/%%post_title%%/gi, '')
    .replace(/\s*\|\s*Septentrional\s*$/i, '')
    .trim()

  return `${title || 'Septentrional'}${title ? ' | Septentrional' : ''}`
}

const normalizeCanonicalUrl = (siteUrl, value) => {
  const target = new URL(value, siteUrl)

  for (const key of [...target.searchParams.keys()]) {
    if (!INDEXABLE_QUERY_PARAMS.has(key)) {
      target.searchParams.delete(key)
    }
  }

  const page = target.searchParams.get('page')
  if (!page || !/^\d+$/.test(page) || Number(page) <= 1) {
    target.searchParams.delete('page')
  }

  target.hash = ''
  return target.toString()
}

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   image?: string,
 *   url?: string,
 *   type?: string,
 *   imageAlt?: string,
 *   publishedTime?: string,
 *   modifiedTime?: string,
 *   structuredData?: Record<string, unknown>,
 *   noIndex?: boolean,
 * }} props
 */
export default function MetaTags({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = 'website',
  imageAlt,
  publishedTime,
  modifiedTime,
  structuredData,
  noIndex = false,
}) {
  const isBrowser = typeof window !== 'undefined'
  const siteUrl = 'https://septentrional.tg'
  const pageTitle = normalizeTitle(title)
  const pageDescription = stripHtml(description || DEFAULT_DESCRIPTION).slice(0, 200)
  
  const currentPath = isBrowser ? `${window.location.pathname}${window.location.search}` : '/'
  const fullUrl = normalizeCanonicalUrl(siteUrl, url || currentPath)
  
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : new URL(image.startsWith('/') ? image : `/storage/${image}`, siteUrl).toString()
    : null

  return (
    <Helmet prioritizeSeoTags>
      <html lang="fr" />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {fullImage && <meta property="og:image" content={fullImage} />}
      {fullImage?.startsWith('https://') && <meta property="og:image:secure_url" content={fullImage} />}
      {fullImage && <meta property="og:image:alt" content={imageAlt || pageTitle} />}
      <meta property="og:site_name" content="Septentrional" />
      <meta property="og:locale" content="fr_FR" />
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      
      <meta name="twitter:card" content={fullImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {fullImage && <meta name="twitter:image" content={fullImage} />}
      {fullImage && <meta name="twitter:image:alt" content={imageAlt || pageTitle} />}
      <meta name="twitter:site" content="@Septentrional" />
      
      <meta name="keywords" content="septentrional, togo, actualités, politique, société, culture, vidéos" />
      <meta name="author" content="Septentrional" />
      <link rel="icon" href="data:," />
      <link rel="canonical" href={fullUrl} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#38A5F8" />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, '\\u003c')}
        </script>
      )}
    </Helmet>
  )
}
