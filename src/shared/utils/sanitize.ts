import createDOMPurify, { type Config } from 'dompurify'
import { normalizeTableColumnWidths } from './editorialAttributes'

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
])

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-presentation'
const IFRAME_REFERRER_POLICY = 'strict-origin-when-cross-origin'

const LEGACY_EDITORIAL_CLASSES = new Set([
  'alignleft',
  'alignright',
  'aligncenter',
  'alignnone',
  'size-large',
  'size-full',
  'size-medium',
  'isSelectedEnd',
])

const TEXT_COLORS = new Set([
  '#000000',
  '#6b7280',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#f97316',
  '#8b5cf6',
])

const HIGHLIGHT_COLORS = new Set([
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fecaca',
  '#fde047',
])

const FONT_FAMILIES = new Map<string, string>([
  ['"plus jakarta sans"', '"Plus Jakarta Sans"'],
  ["'plus jakarta sans'", '"Plus Jakarta Sans"'],
  ['plus jakarta sans', '"Plus Jakarta Sans"'],
  ['lora', 'Lora'],
  ['manrope', 'Manrope'],
  ['inter', 'Inter'],
  ['"source serif 4"', '"Source Serif 4"'],
  ["'source serif 4'", '"Source Serif 4"'],
  ['"times new roman"', '"Times New Roman"'],
  ["'times new roman'", '"Times New Roman"'],
  ["'times new roman', times, serif", '"Times New Roman", Times, serif'],
  ['"times new roman", times, serif', '"Times New Roman", Times, serif'],
])

const MEDIA_WIDTHS = new Set(['25%', '50%', '75%', '100%'])
const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify'])
const LINE_HEIGHTS = new Set(['normal', '1', '1.5', '2'])
const PARAGRAPH_SPACING = new Set(['0.5rem', '1rem', '1.5rem', '2rem'])

const normalizeColor = (value: string, allowed: Set<string>): string | null => {
  const normalized = value.trim().toLowerCase()
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/)
  if (hexMatch) {
    const hex = `#${hexMatch[1]}`
    return allowed.has(hex) ? hex : null
  }

  const rgbMatch = normalized.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  )
  if (!rgbMatch) return null

  const channels = rgbMatch.slice(1).map(Number)
  if (channels.some(channel => channel > 255)) return null

  const hex = `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
  return allowed.has(hex) ? hex : null
}

const sanitizeStyleDeclaration = (property: string, rawValue: string): string | null => {
  const value = rawValue.trim()
  const normalized = value.toLowerCase().replace(/\s+/g, ' ')

  switch (property) {
    case 'color':
      return normalizeColor(value, TEXT_COLORS)
    case 'background-color':
      return normalizeColor(value, HIGHLIGHT_COLORS)
    case 'font-family':
      return FONT_FAMILIES.get(normalized) || null
    case 'text-align':
      return TEXT_ALIGNMENTS.has(normalized) ? normalized : null
    case 'line-height':
      return LINE_HEIGHTS.has(normalized) ? normalized : null
    case 'margin-bottom':
      return PARAGRAPH_SPACING.has(normalized) ? normalized : null
    case 'width':
      return MEDIA_WIDTHS.has(normalized) ? normalized : null
    case 'max-width':
      return normalized === '100%' ? '100%' : null
    case 'height':
      return normalized === 'auto' ? 'auto' : null
    case 'margin':
      return normalized === '1rem 0' ? '1rem 0' : null
    case 'aspect-ratio':
      return normalized === '16/9' || normalized === '16 / 9' ? '16 / 9' : null
    case 'border-radius':
      return normalized === '0.5rem' || normalized === '.5rem' ? '0.5rem' : null
    case 'border':
      return normalized === 'none' ? 'none' : null
    case 'font-weight':
      return ['normal', 'bold', '400', '500', '600', '700', '800', '900'].includes(normalized)
        ? normalized
        : null
    case 'font-style':
      return ['normal', 'italic'].includes(normalized) ? normalized : null
    case 'text-decoration':
      return ['none', 'underline', 'line-through'].includes(normalized) ? normalized : null
    default:
      return null
  }
}

export const sanitizeEditorialStyle = (style: string): string => (
  style
    .split(';')
    .map(declaration => {
      const separatorIndex = declaration.indexOf(':')
      if (separatorIndex < 1) return null

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase()
      // Autoriser plus de propriétés CSS courantes
      const rawValue = declaration.slice(separatorIndex + 1).trim()
      
      if (['font-size', 'min-width', 'width', 'max-width', 'height', 'margin', 'padding', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right'].includes(property)) {
        return `${property}: ${rawValue}`
      }

      if (property === 'color' || property === 'background-color' || property === 'background') {
        return `${property}: ${rawValue}` // On accepte toutes les couleurs pour éviter de casser le style collé
      }

      const safeValue = sanitizeStyleDeclaration(
        property,
        rawValue,
      )

      return safeValue ? `${property}: ${safeValue}` : null
    })
    .filter((declaration): declaration is string => Boolean(declaration))
    .join('; ')
)

const sanitizeLegacyClasses = (className: string): string => (
  className
    .split(/\s+/)
    .filter(token => LEGACY_EDITORIAL_CLASSES.has(token))
    .join(' ')
)

const isSafeLinkHref = (href: string | null): boolean => {
  if (!href) return false

  const candidate = href.trim()
  if (!candidate || /[\u0000-\u001F\u007F]/.test(candidate)) return false
  if (candidate.startsWith('#')) return true
  if (
    candidate.startsWith('/')
    && !candidate.startsWith('//')
    && !candidate.includes('\\')
  ) {
    return true
  }
  if (candidate.startsWith('//') || candidate.includes('\\')) return false

  try {
    const url = new URL(candidate)
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol.toLowerCase())
  } catch {
    return false
  }
}

const canonicalizeLegacyMediaAlignment = (html: string): string => {
  const template = document.createElement('template')
  template.innerHTML = html

  const legacyAlignments: Record<string, string> = {
    'flex-start': 'left',
    center: 'center',
    'flex-end': 'right',
  }

  template.content
    .querySelectorAll<HTMLElement>('div[data-video-wrapper], div[data-youtube-wrapper]')
    .forEach(wrapper => {
      const currentAlign = wrapper.getAttribute('data-align')?.trim()
      if (currentAlign && ['left', 'center', 'right'].includes(currentAlign)) {
        return
      }

      const migratedAlign = legacyAlignments[
        wrapper.style.justifyContent.trim().toLowerCase()
      ]
      if (migratedAlign) {
        wrapper.setAttribute('data-align', migratedAlign)
      }
    })

  return template.innerHTML
}

const isAllowedIframeSrc = (src: string | null): boolean => {
  if (!src) return false

  try {
    const url = new URL(src, window.location.origin)
    return url.protocol === 'https:' && ALLOWED_IFRAME_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

const editorialSanitizer = createDOMPurify(window)

const EDITORIAL_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p', 'div', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'br', 'hr', 'span', 'img', 'blockquote', 'pre', 'code',
    'sub', 'sup', 'mark', 'table', 'thead', 'tbody', 'tfoot',
    'tr', 'td', 'th', 'iframe', 'video',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title', 'class', 'style',
    'src', 'alt', 'width', 'height', 'loading', 'decoding', 'preload',
    'colspan', 'rowspan', 'colwidth',
    'allowfullscreen', 'frameborder', 'sandbox', 'referrerpolicy',
    'allow', 'controls',
    'data-align', 'data-width', 'data-src', 'data-color',
    'data-youtube-wrapper', 'data-video-wrapper',
  ],
  ALLOW_DATA_ATTR: false,
}

editorialSanitizer.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style') {
    const safeStyle = sanitizeEditorialStyle(data.attrValue)
    if (!safeStyle) {
      data.keepAttr = false
      return
    }
    data.attrValue = safeStyle
  }

  if (data.attrName === 'class') {
    const safeClasses = sanitizeLegacyClasses(data.attrValue)
    if (!safeClasses) {
      data.keepAttr = false
      return
    }
    data.attrValue = safeClasses
  }

  if (data.attrName === 'data-src') {
    try {
      const url = new URL(data.attrValue)
      if (!['http:', 'https:'].includes(url.protocol.toLowerCase())) {
        data.keepAttr = false
      }
    } catch {
      data.keepAttr = false
    }
  }

  if (data.attrName === 'data-width' && !MEDIA_WIDTHS.has(data.attrValue.trim())) {
    data.keepAttr = false
  }

  if (
    data.attrName === 'data-align'
    && !['left', 'center', 'right'].includes(data.attrValue.trim())
  ) {
    data.keepAttr = false
  }

  if (data.attrName === 'data-color' && !normalizeColor(data.attrValue, HIGHLIGHT_COLORS)) {
    data.keepAttr = false
  }

  if (data.attrName === 'colwidth') {
    const widths = normalizeTableColumnWidths(data.attrValue)
    if (!widths) {
      data.keepAttr = false
      return
    }
    data.attrValue = widths.join(',')
  }
})

editorialSanitizer.addHook('afterSanitizeAttributes', node => {
  const tagName = node.tagName.toLowerCase()

  if (tagName === 'a') {
    const href = node.getAttribute('href')
    if (!isSafeLinkHref(href)) {
      node.removeAttribute('href')
      node.removeAttribute('target')
      node.removeAttribute('rel')
      return
    }

    if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }

  if (tagName === 'img') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
  }

  if (tagName === 'video') {
    node.setAttribute('controls', '')
    node.setAttribute('preload', 'metadata')
  }

  if (tagName === 'iframe') {
    if (!isAllowedIframeSrc(node.getAttribute('src'))) {
      node.remove()
      return
    }

    node.setAttribute('sandbox', IFRAME_SANDBOX)
    node.setAttribute('referrerpolicy', IFRAME_REFERRER_POLICY)
    node.setAttribute('loading', 'lazy')
    node.setAttribute('title', node.getAttribute('title') || 'Vidéo intégrée')
  }
})

export const sanitizeHtml = (html: string): string => {
  if (!html) return ''
  return editorialSanitizer.sanitize(
    canonicalizeLegacyMediaAlignment(html),
    EDITORIAL_SANITIZE_CONFIG,
  )
}
