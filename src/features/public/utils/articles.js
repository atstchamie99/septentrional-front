export const getList = (payload) => {
  const body = payload?.data ?? payload

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.items)) return body.items
  if (Array.isArray(body?.results)) return body.results
  if (Array.isArray(body?.data?.data)) return body.data.data

  return []
}

export const getFirstObject = (payload) => {
  const list = getList(payload)
  if (list.length) return list[0]

  const body = payload?.data ?? payload
  if (body?.data && !Array.isArray(body.data)) return body.data
  if (body && typeof body === 'object' && !Array.isArray(body)) return body

  return null
}


const API_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || '/api/v2'
  try {
    return base.startsWith('http') ? new URL(base).origin : ''
  } catch {
    return ''
  }
})()

export const resolveImageUrl = (url) => {
  if (!url) return ''

  let relativeUrl = null

  try {
    const parsedUrl = new URL(url)
    // Sans VITE_API_URL absolue, Vite communique avec l'API locale via son proxy.
    // On conserve alors le chemin, même si APP_URL local contient par erreur le domaine de production.
    if (
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      (!API_ORIGIN && parsedUrl.pathname.startsWith('/storage/'))
    ) {
      relativeUrl = parsedUrl.pathname + parsedUrl.search
    }
  } catch (e) {
    // URL non valide ou déjà relative, on continue
  }

  // Pour les chemins relatifs, on s'assure qu'ils commencent par un slash
  if (relativeUrl === null && !url.startsWith('http://') && !url.startsWith('https://')) {
    relativeUrl = url.startsWith('/') ? url : `/${url}`
  }

  if (relativeUrl !== null) {
    // En production, les fichiers sont servis par l'API, pas par le site React.
    // En développement API_ORIGIN est vide : le proxy Vite conserve le chemin relatif.
    if (relativeUrl.startsWith('/storage/') && API_ORIGIN) {
      return `${API_ORIGIN}${relativeUrl}`
    }

    return relativeUrl
  }

  return url
}

export const getImage = (item) =>
  resolveImageUrl(
    item?.image_principale_url ||
    item?.image_principale ||
    item?.image_url ||
    item?.miniature_url ||
    item?.miniature ||
    item?.thumbnail ||
    item?.photo ||
    item?.image ||
    ''
  )

export const getTitle = (item) => {
  const val = item?.titre ?? item?.title ?? item?.nom ?? ''
  return typeof val === 'string' ? val : ''
}

/**
 * Strip HTML tags from a string and return plain text.
 * Useful for displaying rich-text descriptions as plain text in cards.
 */
export const stripHtml = (html) => {
  if (!html) return ''
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  return html.replace(/<[^>]*>/g, '')
}

export const getCategoryLabel = (article) => {
  const cat = article?.categorie ?? article?.category
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  if (typeof cat === 'object') {
    const label = cat.nom || cat.name || cat.titre || cat.title || ''
    return typeof label === 'string' ? label : ''
  }
  return ''
}

export const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const getCategorySlug = (category) =>
  category?.slug ||
  normalizeText(category?.nom || category?.name).replaceAll(' ', '-')

export const articleMatchesCategory = (article, categoryName) => {
  const target = normalizeText(categoryName)
  const haystack = [
    article?.categorie?.slug,
    article?.category?.slug,
    article?.categorie_slug,
    article?.category_slug,
    getCategoryLabel(article),
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ')

  return haystack.includes(target)
}

export const selectPriorityNews = (articles, limit = 10) => {
  const selected = []
  const used = new Set()

  const keyOf = (article) => article?.id || article?.slug || getTitle(article)

  const addArticles = (items, max) => {
    let addedCount = 0
    for (const article of items) {
      if (selected.length >= limit) break
      if (max !== undefined && addedCount >= max) break

      const key = keyOf(article)
      if (!key || used.has(key)) continue

      used.add(key)
      selected.push(article)
      addedCount++
    }
  }

  const presidenceArticles = articles.filter((article) =>
    articleMatchesCategory(article, 'presidence') || articleMatchesCategory(article, 'president du conseil')
  )
  const politiqueArticles = articles.filter((article) =>
    articleMatchesCategory(article, 'politique')
  )
  const sportArticles = articles.filter((article) =>
    articleMatchesCategory(article, 'sport')
  )

  // 1 Le tout dernier article en PREMIER
  addArticles(articles, 1)
  
  // 3 Politique
  addArticles(politiqueArticles, 3)
  // 3 Présidence / Président du Conseil
  addArticles(presidenceArticles, 3)
  // 2 Sport
  addArticles(sportArticles, 2)
  
  // Fill remaining if any category is short to ensure we always have up to 'limit'
  addArticles(articles) 

  return selected.slice(0, limit)
}

export const sortCategories = (categories) => {
  const priorityKeywords = ['présidence', 'presidence', 'conseil des ministres', 'sport', 'education', 'éducation']

  return [...categories].sort((a, b) => {
    const nomA = (a.nom || a.name || '').toLowerCase()
    const nomB = (b.nom || b.name || '').toLowerCase()

    let indexA = priorityKeywords.findIndex(kw => nomA.includes(kw))
    let indexB = priorityKeywords.findIndex(kw => nomB.includes(kw))

    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    return nomA.localeCompare(nomB)
  })
}
