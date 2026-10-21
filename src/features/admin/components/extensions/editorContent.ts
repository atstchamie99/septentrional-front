import { Node, type Editor } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import BaseTableCell from '@tiptap/extension-table-cell'
import BaseTableHeader from '@tiptap/extension-table-header'
import { normalizeTableColumnWidths } from '@shared/utils/editorialAttributes'

const MEDIA_WIDTHS = new Set(['25%', '50%', '75%', '100%'])
const MEDIA_ALIGNMENTS = new Set(['left', 'center', 'right'])
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-presentation'
const IMAGE_WIDTHS = new Set(['25%', '50%', '75%', '100%'])
const IMAGE_ALIGNMENTS = new Set(['left', 'center', 'right'])
const LEGACY_IMAGE_ALIGNMENTS: Record<string, string> = {
  alignleft: 'left',
  aligncenter: 'center',
  alignright: 'right',
}

const normalizeMediaWidth = (width?: string | null) =>
  width && MEDIA_WIDTHS.has(width.trim()) ? width.trim() : '100%'

const normalizeMediaAlign = (align?: string | null) =>
  align && MEDIA_ALIGNMENTS.has(align.trim()) ? align.trim() : 'center'

const getMediaAlign = (element: HTMLElement) => {
  const explicitAlign = element.getAttribute('data-align')?.trim()
  if (explicitAlign && MEDIA_ALIGNMENTS.has(explicitAlign)) {
    return explicitAlign
  }

  const legacyAlignments: Record<string, string> = {
    'flex-start': 'left',
    center: 'center',
    'flex-end': 'right',
  }

  return legacyAlignments[element.style.justifyContent.trim().toLowerCase()] || 'center'
}

const getNestedStyleWidth = (element: HTMLElement, selector: string) => {
  const child = element.querySelector<HTMLElement>(selector)
  return child?.getAttribute('width') || child?.style.width || null
}

const normalizeImageWidth = (value?: string | null) => {
  const width = value?.trim()
  return width && IMAGE_WIDTHS.has(width) ? width : '100%'
}

const getImageWidth = (element: HTMLElement) => {
  const candidates = [
    element.getAttribute('width'),
    element.style.width,
  ]

  return candidates
    .map(value => value?.trim())
    .find(value => value && IMAGE_WIDTHS.has(value))
    || '100%'
}

const getImageAlign = (element: HTMLElement) => {
  const explicitAlign = element.getAttribute('data-align')?.trim()
  if (explicitAlign && IMAGE_ALIGNMENTS.has(explicitAlign)) {
    return explicitAlign
  }

  for (const className of element.classList) {
    const legacyAlign = LEGACY_IMAGE_ALIGNMENTS[className.toLowerCase()]
    if (legacyAlign) return legacyAlign
  }

  return 'center'
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => getImageWidth(element),
        renderHTML: attributes => {
          const width = normalizeImageWidth(attributes.width)
          return {
            width,
            style: `width: ${width}; max-width: 100%; height: auto;`,
          }
        },
      },
      align: {
        default: 'center',
        parseHTML: element => getImageAlign(element),
        renderHTML: attributes => ({
          'data-align': IMAGE_ALIGNMENTS.has(attributes.align)
            ? attributes.align
            : 'center',
        }),
      },
      loading: {
        default: 'lazy',
        parseHTML: element => element.getAttribute('loading') || 'lazy',
        renderHTML: () => ({ loading: 'lazy' }),
      },
      decoding: {
        default: 'async',
        parseHTML: element => element.getAttribute('decoding') || 'async',
        renderHTML: () => ({ decoding: 'async' }),
      },
    }
  },
})

const safeColwidthAttribute = () => ({
  default: null,
  parseHTML: (element: HTMLElement) =>
    normalizeTableColumnWidths(element.getAttribute('colwidth')),
})

export const SafeTableCell = BaseTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: safeColwidthAttribute(),
    }
  },
})

export const SafeTableHeader = BaseTableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: safeColwidthAttribute(),
    }
  },
})

export const normalizeSafeLink = (value: string): string | null => {
  const candidate = value.trim()
  if (!candidate) return null

  if (/[\u0000-\u001F\u007F]/.test(candidate)) return null

  // Liens internes historiques : on accepte un chemin racine ou une ancre,
  // mais jamais une URL protocol-relative ni une variante avec antislash.
  if (candidate.startsWith('#')) {
    return candidate
  }

  if (
    candidate.startsWith('/')
    && !candidate.startsWith('//')
    && !candidate.includes('\\')
  ) {
    return candidate
  }

  try {
    const url = new URL(candidate)
    if (!SAFE_LINK_PROTOCOLS.has(url.protocol.toLowerCase())) return null
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname) return null
    if (url.protocol === 'mailto:' && !url.pathname) return null
    if (url.protocol === 'tel:' && !url.pathname) return null
    return candidate
  } catch {
    return null
  }
}

export const getYoutubeEmbedUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoId = ''

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || ''
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/)
        videoId = match?.[1] || ''
      }
    }

    return /^[A-Za-z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
      : null
  } catch {
    return null
  }
}

export const applySafeLinkToEditor = (editor: Editor, value: string): boolean => {
  const safeLink = normalizeSafeLink(value)
  if (!safeLink) return false

  const { from, to } = editor.state.selection

  if (editor.isActive('link')) {
    editor.chain().focus().extendMarkRange('link').setLink({ href: safeLink }).run()
    const linkEnd = editor.state.selection.to
    editor.chain().focus().setTextSelection(linkEnd).unsetMark('link').run()
    return true
  }

  if (from === to) {
    return editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'text',
          text: safeLink,
          marks: [{ type: 'link', attrs: { href: safeLink } }],
        },
        {
          type: 'text',
          text: ' ',
        },
      ])
      .unsetMark('link')
      .run()
  }

  editor.chain().focus().setLink({ href: safeLink }).run()
  const linkEnd = editor.state.selection.to
  editor.chain().focus().setTextSelection(linkEnd).unsetMark('link').run()
  return true
}

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element =>
          element.getAttribute('data-src')
          || element.querySelector('video')?.getAttribute('src')
          || null,
      },
      width: {
        default: '100%',
        parseHTML: element =>
          normalizeMediaWidth(
            element.getAttribute('data-width')
            || getNestedStyleWidth(element, 'video'),
          ),
      },
      align: {
        default: 'center',
        parseHTML: element => getMediaAlign(element),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-video-wrapper]' }]
  },

  renderHTML({ node }) {
    const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
    const width = normalizeMediaWidth(node.attrs.width)
    const align = normalizeMediaAlign(node.attrs.align)

    return [
      'div',
      {
        'data-video-wrapper': '',
        'data-src': src,
        'data-width': width,
        'data-align': align,
      },
      ['video', { src, controls: 'true', preload: 'metadata' }],
    ]
  },
})

export const YoutubeNode = Node.create({
  name: 'youtubeVideo',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element =>
          element.getAttribute('data-src')
          || element.querySelector('iframe')?.getAttribute('src')
          || null,
      },
      width: {
        default: '100%',
        parseHTML: element =>
          normalizeMediaWidth(
            element.getAttribute('data-width')
            || getNestedStyleWidth(element, 'iframe'),
          ),
      },
      align: {
        default: 'center',
        parseHTML: element => getMediaAlign(element),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-youtube-wrapper]' }]
  },

  renderHTML({ node }) {
    const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
    const embedSrc = getYoutubeEmbedUrl(src) || ''
    const width = normalizeMediaWidth(node.attrs.width)
    const align = normalizeMediaAlign(node.attrs.align)

    return [
      'div',
      {
        'data-youtube-wrapper': '',
        'data-src': src,
        'data-width': width,
        'data-align': align,
      },
      ['iframe', {
        src: embedSrc,
        allowfullscreen: 'true',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        loading: 'lazy',
        referrerpolicy: 'strict-origin-when-cross-origin',
        sandbox: IFRAME_SANDBOX,
      }],
    ]
  },
})
