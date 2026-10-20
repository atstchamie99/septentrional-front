import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import LinkExtension from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/react'

const CustomLinkExtension = LinkExtension.extend({
  inclusive: false,
})

export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'], defaultLineHeight: 'normal' } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: element => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: attributes => {
              if (attributes.lineHeight === this.options.defaultLineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight }))
      },
      unsetLineHeight: () => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, 'lineHeight'))
      },
    } as any
  },
})

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',
  addOptions() { return { types: ['paragraph', 'heading'], defaultSpacing: 'normal' } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spacing: {
            default: this.options.defaultSpacing,
            parseHTML: element => {
              const mb = element.style.marginBottom
              if (!mb) return this.options.defaultSpacing
              if (mb === '0.5rem') return 'compact'
              if (mb === '1rem' || mb === '') return 'normal'
              if (mb === '1.5rem') return 'spacious'
              if (mb === '2rem') return 'large'
              return this.options.defaultSpacing
            },
            renderHTML: attributes => {
              if (attributes.spacing === this.options.defaultSpacing) return {}
              const values: Record<string, string> = {
                compact: '0.5rem',
                normal: '1rem',
                spacious: '1.5rem',
                large: '2rem',
              }
              return { style: `margin-bottom: ${values[attributes.spacing] || values.normal}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setSpacing: (spacing: string) => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.updateAttributes(type, { spacing }))
      },
      unsetSpacing: () => ({ commands }: any) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, 'spacing'))
      },
    } as any
  },
})
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import apiClient from '@/services/api/client'
import { SlashCommand } from './extensions/slashCommand'
import {
  applySafeLinkToEditor,
  getYoutubeEmbedUrl,
  normalizeSafeLink,
  ResizableImage,
  SafeTableCell,
  SafeTableHeader,
  VideoNode,
  YoutubeNode,
} from './extensions/editorContent'
import {
  Upload,
  Image as ImageIcon,
  Table as TableIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Quote,
  Redo,
  Undo,
  Link,
  Minus,
  Maximize,
  Type,
  Film,
  Tv,
  Heading1,
  Heading2,
  Heading3,
  Heading,
  ArrowUpDown,
  Highlighter,
  Terminal,
  Eraser,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface TiptapEditorProps {
  value: string
  onChange: (content: string) => void
  height?: number
}

// Colors for text
const colors = [
  { label: 'Noir', value: '#000000' },
  { label: 'Gris', value: '#6b7280' },
  { label: 'Rouge', value: '#ef4444' },
  { label: 'Vert', value: '#22c55e' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Jaune', value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Violet', value: '#8b5cf6' },
]

// Font Families
const fontFamilies = [
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans"' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Source Serif 4', value: '"Source Serif 4"' },
  { label: 'Times New Roman', value: '"Times New Roman"' },
  { label: 'Inter', value: 'Inter' },
]

export default function TiptapEditor({ value, onChange, height = 350 }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [showYoutubeModal, setShowYoutubeModal] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload to server
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    setIsUploading(true)
    toast.loading('Upload de l\'image en cours...', { id: 'image-upload' })

    try {
      const response = await apiClient.post('/admin/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      })

      let imageUrl = response.data.url
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const u = new URL(imageUrl)
          imageUrl = u.pathname + u.search
        } catch (e) {}
      }
      toast.success('Image uploadée avec succès !', { id: 'image-upload' })
      return imageUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      const message = error.response?.data?.message || error.response?.data?.errors?.image?.[0] || 'Échec de l\'upload'
      toast.error(message, { id: 'image-upload' })
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: {},
        italic: {},
        code: {},
        blockquote: {},
        bulletList: {},
        orderedList: {},
        heading: { levels: [1, 2, 3, 4] },
        horizontalRule: {},
        // Le mark "strike" est enregistré séparément ci-dessous (extension-strike) :
        // le laisser actif ici en plus provoquerait un conflit de nom d'extension.
        strike: false,
      }),
      LineHeight,
      ParagraphSpacing,
      Color.configure({ types: ['textStyle'] }),
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Strike,
      Superscript,
      Subscript,
      CustomLinkExtension.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['mailto', 'tel'],
        isAllowedUri: url => normalizeSafeLink(url) !== null,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Écrivez votre contenu ici...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      SafeTableCell,
      SafeTableHeader,
      ResizableImage,
      VideoNode,
      YoutubeNode,
      SlashCommand,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handlePaste: (_view, event) => {
        const items = (event.clipboardData || (window as any).clipboardData)?.items
        if (!items) return false
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault()
            const blob = items[i].getAsFile()
            if (blob) {
              uploadImage(blob).then((url) => {
                if (editor) {
                  editor.commands.insertContent({
                    type: 'image',
                    attrs: { src: url },
                  })
                }
              }).catch(() => {})
            }
            return false
          }
        }
        return false
      },
      handleDrop: (_view, event) => {
        const items = event.dataTransfer?.items
        if (!items) return false
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault()
            const blob = items[i].getAsFile()
            if (blob) {
              uploadImage(blob).then((url) => {
                if (editor) {
                  editor.commands.insertContent({
                    type: 'image',
                    attrs: { src: url },
                  })
                }
              }).catch(() => {})
            }
            return false
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    const nextContent = value || ''
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false)
    }
  }, [editor, value])

  // Insert image from URL
  const insertImage = useCallback(async (url: string) => {
    if (editor) {
      editor.commands.insertContent({
        type: 'image',
        attrs: { src: url },
      })
    }
    setShowImageModal(false)
    setImageFile(null)
    setImagePreview(null)
  }, [editor])

  // Handle file selection for image
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/.*/)) {
        toast.error('Seules les images sont acceptées (JPEG, PNG, GIF, WEBP)')
        return
      }
      
      const MAX_SIZE = 50 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        toast.error("L'image est trop grande (maximum 50 Mo)")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Upload and insert the selected image
  const handleImageUpload = useCallback(async () => {
    if (!imageFile) return
    
    try {
      const url = await uploadImage(imageFile)
      insertImage(url)
    } catch (error) {
      // Error already handled
    }
  }, [imageFile, uploadImage, insertImage])

  // Insert Custom Table
  const insertCustomTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run()
    }
    setShowTableModal(false)
  }, [editor, tableRows, tableCols])

  // Insert/update/remove link (utilise le mark "link" enregistré via @tiptap/extension-link)
  const insertLink = useCallback(() => {
    if (!editor) return

    const safeLink = normalizeSafeLink(linkUrl)
    if (!safeLink) {
      toast.error('Utilisez une adresse http(s), mailto:, tel:, /chemin ou #ancre valide.')
      return
    }

    const currentText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')
    if (linkText && linkText !== currentText) {
      // Insertion d'un lien avec un nœud texte non lié à la suite
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'text',
            text: linkText,
            marks: [{ type: 'link', attrs: { href: safeLink } }],
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .unsetMark('link')
        .run()
    } else {
      // Appliquer le lien à la sélection actuelle
      applySafeLinkToEditor(editor, safeLink)
    }

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }, [editor, linkUrl, linkText])

  const removeLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
  }, [editor])

  // Toolbar buttons
  const toolbarButtons = [
    { 
      label: 'Titres', 
      icon: <Heading className="w-4 h-4" />, 
      action: () => {},
      isActive: editor?.isActive('heading'),
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-1 w-40 p-1">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none ${editor?.isActive('heading', { level: 1 }) ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : ''}`}><Heading1 className="w-4 h-4 inline-block mr-2" /> Titre 1</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none ${editor?.isActive('heading', { level: 2 }) ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : ''}`}><Heading2 className="w-4 h-4 inline-block mr-2" /> Titre 2</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none ${editor?.isActive('heading', { level: 3 }) ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : ''}`}><Heading3 className="w-4 h-4 inline-block mr-2" /> Titre 3</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()} className={`px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none ${editor?.isActive('heading', { level: 4 }) ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : ''}`}><Heading className="w-4 h-4 inline-block mr-2" /> Titre 4</button>
          <div className="border-t border-gray-100 my-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setParagraph().run()} className={`px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none ${editor?.isActive('paragraph') ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : ''}`}><Type className="w-4 h-4 inline-block mr-2" /> Paragraphe</button>
        </div>
      )
    },
    { type: 'divider' },
    { 
      label: 'Gras', 
      icon: <Bold className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive('bold'),
    },
    { 
      label: 'Italique', 
      icon: <Italic className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive('italic'),
    },
    { 
      label: 'Souligné', 
      icon: <UnderlineIcon className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: editor?.isActive('underline'),
    },
    { 
      label: 'Barré', 
      icon: <StrikethroughIcon className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleStrike().run(),
      isActive: editor?.isActive('strike'),
    },
    { type: 'divider' },
    { 
      label: 'Couleur', 
      icon: <div className="w-4 h-4 rounded-none border border-black/15 bg-sept-blue-strong" />,
      action: () => {},
      isActive: false,
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-wrap gap-1 p-2">
          {colors.map((color) => (
            <button
              type="button"
              key={color.value}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setColor(color.value).run()}
              className={`w-6 h-6 rounded-none border border-black/10 ${editor?.isActive('textStyle', { color: color.value }) ? 'ring-2 ring-sept-blue-strong' : ''}`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      )
    },
    { type: 'divider' },
    {
      label: 'Police',
      icon: <Type className="w-4 h-4" />,
      action: () => {},
      isActive: false,
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-0.5 p-1 w-48">
          {fontFamilies.map((f) => (
            <button
              type="button"
              key={f.value}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setFontFamily(f.value).run()}
              className={`px-3 py-2 text-sm text-left rounded-none hover:bg-gray-100 transition-colors ${
                editor?.isActive('textStyle', { fontFamily: f.value }) ? 'bg-sept-blue-strong/10 text-sept-blue-strong font-semibold' : 'text-gray-700'
              }`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().unsetFontFamily().run()}
              className="px-3 py-2 text-xs text-left rounded-none hover:bg-gray-100 text-gray-400 w-full"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    { 
      label: 'Alignement', 
      icon: <AlignLeft className="w-4 h-4" />, 
      action: () => {},
      isActive: false,
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-100' : ''}`}
          >
            <AlignLeft className="w-4 h-4" /> Aligner à gauche
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-100' : ''}`}
          >
            <AlignCenter className="w-4 h-4" /> Centrer
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-100' : ''}`}
          >
            <AlignRight className="w-4 h-4" /> Aligner à droite
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-gray-100' : ''}`}
          >
            <AlignJustify className="w-4 h-4" /> Justifier
          </button>
        </div>
      )
    },
    { type: 'divider' },
    { 
      label: 'Liste à puces', 
      icon: <List className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: editor?.isActive('bulletList'),
    },
    { 
      label: 'Liste numérotée', 
      icon: <ListOrdered className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: editor?.isActive('orderedList'),
    },
    { type: 'divider' },
    { 
      label: 'Citation', 
      icon: <Quote className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: editor?.isActive('blockquote'),
    },
    { 
      label: 'Code en ligne', 
      icon: <Code className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleCode().run(),
      isActive: editor?.isActive('code'),
    },
    { type: 'divider' },
    { 
      label: 'Lien',
      icon: <Link className="w-4 h-4" />,
      action: () => {
        setLinkUrl(editor?.getAttributes('link').href || '')
        const { from, to } = editor?.state.selection || { from: 0, to: 0 }
        const text = editor?.state.doc.textBetween(from, to, ' ') || ''
        setLinkText(text)
        setShowLinkModal(true)
      },
      isActive: editor?.isActive('link'),
    },
    { 
      label: 'Image', 
      icon: <ImageIcon className="w-4 h-4" />, 
      action: () => setShowImageModal(true),
      isActive: false,
      disabled: isUploading
    },
    { 
      label: 'Taille & Alignement (Média)', 
      icon: <Maximize className="w-4 h-4" />, 
      action: () => {},
      isActive: false,
      disabled: !(editor?.isActive('image') || editor?.isActive('video') || editor?.isActive('youtubeVideo')),
      dropdown: true,
      dropdownContent: (() => {
        const setAttr = (key: string, val: string) => {
          if (editor?.isActive('image')) editor.chain().focus().updateAttributes('image', { [key]: val }).run()
          if (editor?.isActive('video')) editor.chain().focus().updateAttributes('video', { [key]: val }).run()
          if (editor?.isActive('youtubeVideo')) editor.chain().focus().updateAttributes('youtubeVideo', { [key]: val }).run()
        }
        return (
          <div className="flex flex-col gap-1 w-40 p-1">
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Taille</p>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('width', '25%')}  className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Petite (25%)</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('width', '50%')}  className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Moyenne (50%)</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('width', '75%')}  className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Grande (75%)</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('width', '100%')} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Pleine largeur</button>
            <div className="border-t border-gray-100 my-1" />
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Alignement</p>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('align', 'left')}   className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none flex items-center gap-2"><AlignLeft   className="w-3.5 h-3.5" /> Gauche</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('align', 'center')} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none flex items-center gap-2"><AlignCenter className="w-3.5 h-3.5" /> Centre</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setAttr('align', 'right')}  className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none flex items-center gap-2"><AlignRight  className="w-3.5 h-3.5" /> Droite</button>
          </div>
        )
      })()
    },
    { 
      label: 'Tableau', 
      icon: <TableIcon className="w-4 h-4" />, 
      action: () => setShowTableModal(true),
      isActive: false,
    },
    { type: 'divider' },
    {
      label: 'YouTube',
      icon: <Tv className="w-4 h-4 text-red-500" />,
      action: () => setShowYoutubeModal(true),
      isActive: false,
    },
    {
      label: 'Vidéo MP4',
      icon: <Film className="w-4 h-4 text-blue-500" />,
      action: () => videoInputRef.current?.click(),
      isActive: false,
      disabled: isUploadingVideo,
    },
    { type: 'divider' },
    { 
      label: 'Séparateur', 
      icon: <Minus className="w-4 h-4" />, 
      action: () => editor?.chain().focus().setHorizontalRule().run(),
      isActive: false,
    },
    { type: 'divider' },
    { 
      label: 'Annuler', 
      icon: <Undo className="w-4 h-4" />, 
      action: () => editor?.chain().focus().undo().run(),
      isActive: false,
      disabled: !editor?.can().undo()
    },
    { 
      label: 'Rétablir', 
      icon: <Redo className="w-4 h-4" />, 
      action: () => editor?.chain().focus().redo().run(),
      isActive: false,
      disabled: !editor?.can().redo()
    },
    { type: 'divider' },
    { 
      label: 'Superscript', 
      icon: <SuperscriptIcon className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleSuperscript().run(),
      isActive: editor?.isActive('superscript'),
    },
    { 
      label: 'Subscript', 
      icon: <SubscriptIcon className="w-4 h-4" />, 
      action: () => editor?.chain().focus().toggleSubscript().run(),
      isActive: editor?.isActive('subscript'),
    },
    { type: 'divider' },
    {
      label: 'Surlignage',
      icon: <Highlighter className="w-4 h-4 text-yellow-500" />,
      action: () => {},
      isActive: editor?.isActive('highlight'),
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-0.5 p-1">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-none ${editor?.isActive('highlight', { color: '#fef08a' }) ? 'bg-gray-100' : ''}`}><span className="w-4 h-4 rounded-none border border-black/10" style={{ backgroundColor: '#fef08a' }} /> Jaune</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#bbf7d0' }).run()} className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-none ${editor?.isActive('highlight', { color: '#bbf7d0' }) ? 'bg-gray-100' : ''}`}><span className="w-4 h-4 rounded-none border border-black/10" style={{ backgroundColor: '#bbf7d0' }} /> Vert</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#bfdbfe' }).run()} className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-none ${editor?.isActive('highlight', { color: '#bfdbfe' }) ? 'bg-gray-100' : ''}`}><span className="w-4 h-4 rounded-none border border-black/10" style={{ backgroundColor: '#bfdbfe' }} /> Bleu</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fecaca' }).run()} className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-none ${editor?.isActive('highlight', { color: '#fecaca' }) ? 'bg-gray-100' : ''}`}><span className="w-4 h-4 rounded-none border border-black/10" style={{ backgroundColor: '#fecaca' }} /> Rouge</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fde047' }).run()} className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-none ${editor?.isActive('highlight', { color: '#fde047' }) ? 'bg-gray-100' : ''}`}><span className="w-4 h-4 rounded-none border border-black/10" style={{ backgroundColor: '#fde047' }} /> Orange</button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => editor?.chain().focus().unsetHighlight().run()} className="px-3 py-2 text-xs rounded-none hover:bg-gray-100 text-gray-400 w-full text-left">Retirer le surlignage</button>
          </div>
        </div>
      ),
    },
    { 
      label: 'Bloc de code',
      icon: <Terminal className="w-4 h-4" />,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: editor?.isActive('codeBlock'),
    },
    { type: 'divider' },
    {
      label: 'Interlignage',
      icon: <ArrowUpDown className="w-4 h-4" />,
      action: () => {},
      isActive: false,
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-0.5 p-1 w-40">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { lineHeight: '1' }).run(); editor?.chain().focus().updateAttributes('heading', { lineHeight: '1' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Serré (1)</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { lineHeight: '1.5' }).run(); editor?.chain().focus().updateAttributes('heading', { lineHeight: '1.5' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Normal (1.5)</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { lineHeight: '2' }).run(); editor?.chain().focus().updateAttributes('heading', { lineHeight: '2' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Aéré (2)</button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().resetAttributes('paragraph', 'lineHeight').run(); editor?.chain().focus().resetAttributes('heading', 'lineHeight').run() }} className="px-3 py-2 text-xs rounded-none hover:bg-gray-100 text-gray-400 w-full text-left">Réinitialiser</button>
          </div>
        </div>
      ),
    },
    {
      label: 'Espacement',
      icon: <ArrowUpDown className="w-4 h-4 rotate-90" />,
      action: () => {},
      isActive: false,
      dropdown: true,
      dropdownContent: (
        <div className="flex flex-col gap-0.5 p-1 w-40">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { spacing: 'compact' }).run(); editor?.chain().focus().updateAttributes('heading', { spacing: 'compact' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Compact</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { spacing: 'normal' }).run(); editor?.chain().focus().updateAttributes('heading', { spacing: 'normal' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Normal</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { spacing: 'spacious' }).run(); editor?.chain().focus().updateAttributes('heading', { spacing: 'spacious' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Aéré</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().updateAttributes('paragraph', { spacing: 'large' }).run(); editor?.chain().focus().updateAttributes('heading', { spacing: 'large' }).run() }} className="px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-none">Large</button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { editor?.chain().focus().resetAttributes('paragraph', 'spacing').run(); editor?.chain().focus().resetAttributes('heading', 'spacing').run() }} className="px-3 py-2 text-xs rounded-none hover:bg-gray-100 text-gray-400 w-full text-left">Réinitialiser</button>
          </div>
        </div>
      ),
    },
    {
      label: 'Effacer le formatage',
      icon: <Eraser className="w-4 h-4" />,
      action: () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
      isActive: false,
    },
    { type: 'divider' },
    {
      label: isFullscreen ? 'Quitter le plein écran' : 'Plein écran',
      icon: isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />,
      action: () => setIsFullscreen(!isFullscreen),
      isActive: isFullscreen,
    },
  ]

  const wordCount = editor ? editor.storage.characterCount?.words?.() ?? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = editor ? editor.getText().length : 0

  return (
    <div className={`tiptap-editor-wrapper border border-gray-200 rounded-none overflow-hidden bg-white ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButtons.map((btn, index) => {
            if (btn.type === 'divider') {
              return <div key={`div-${index}`} className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0" />
            }
            return (
              <div key={btn.label} className="relative group flex-shrink-0">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={btn.action}
                  disabled={btn.disabled}
                  className={`p-1.5 rounded-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    btn.isActive ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : 'text-gray-600'
                  }`}
                  title={btn.label}
                >
                  {btn.icon}
                </button>
                {btn.dropdown && (
                  <div className="absolute top-full left-0 pt-1 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150">
                    <div className="bg-white shadow-lg rounded-none border border-gray-200">
                      {btn.dropdownContent}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor Content */}
      <div
        className="p-4 overflow-y-auto cursor-text min-h-[350px] pb-24"
        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`, maxHeight: isFullscreen ? 'calc(100vh - 120px)' : 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget && editor) {
            const lastNode = editor.state.doc.lastChild
            if (lastNode && lastNode.type.name !== 'paragraph') {
              editor.chain().focus().insertContentAt(editor.state.doc.content.size, '<p></p>').run()
            } else {
              editor.commands.focus('end')
            }
          }
        }}
      >
        {editor && <EditorContent editor={editor} />}
        
        {!editor && (
          <div className="text-gray-400 text-sm">
            Chargement de l'éditeur...
          </div>
        )}
      </div>

      {/* Word/char count */}
      {editor && (
        <div className="flex items-center justify-end gap-4 px-4 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
          <span>{wordCount} mots</span>
          <span>{charCount} caractères</span>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 bg-gray-50">
              <h3 className="text-base font-bold uppercase tracking-wider text-sept-blue-strong">Insérer une image</h3>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => {
                  setShowImageModal(false)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-none text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="border-2 border-dashed border-gray-300 hover:border-sept-blue-strong rounded-none p-6 text-center cursor-pointer transition-colors bg-gray-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="image-upload-input"
                />
                <label htmlFor="image-upload-input" className="cursor-pointer block">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-40 mx-auto rounded-none shadow-sm object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="w-12 h-12 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sept-blue-strong">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Cliquez pour choisir une image</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase">JPEG, PNG, GIF, WEBP (Max 2MB)</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => {
                  setShowImageModal(false)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-none transition-colors border border-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={handleImageUpload}
                disabled={!imageFile || isUploading}
                className="btn-primary rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Upload en cours...' : 'Insérer l\'image'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Link Modal */}
      {showLinkModal && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 bg-gray-50">
              <h3 className="text-base font-bold uppercase tracking-wider text-sept-blue-strong">Insérer un lien</h3>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => {
                  setShowLinkModal(false)
                  setLinkUrl('')
                  setLinkText('')
                }}
                className="p-1.5 hover:bg-gray-200 rounded-none text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Texte à afficher
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texte du lien"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  URL du lien
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemple.com, mailto:... ou tel:..."
                  className="input-field"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              {editor?.isActive('link') && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={removeLink}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-none border border-red-200"
                >
                  Dissocier
                </button>
              )}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => {
                  setShowLinkModal(false)
                  setLinkUrl('')
                  setLinkText('')
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-none transition-colors border border-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="btn-primary rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Table Modal */}
      {showTableModal && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 bg-gray-50">
              <h3 className="text-base font-bold uppercase tracking-wider text-sept-blue-strong">Insérer un tableau</h3>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setShowTableModal(false)} className="p-1.5 hover:bg-gray-200 rounded-none text-gray-500 hover:text-gray-700 transition-colors">
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Lignes</label>
                  <input type="number" min="1" max="20" value={tableRows} onChange={e => setTableRows(parseInt(e.target.value) || 1)} className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Colonnes</label>
                  <input type="number" min="1" max="20" value={tableCols} onChange={e => setTableCols(parseInt(e.target.value) || 1)} className="input-field" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setShowTableModal(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-none transition-colors border border-gray-300">Annuler</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={insertCustomTable} className="btn-primary rounded-none">Insérer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 bg-gray-50">
              <h3 className="text-base font-bold uppercase tracking-wider text-sept-blue-strong flex items-center gap-2">
                <span className="text-red-500 font-bold">▶</span> Vidéo YouTube
              </h3>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { setShowYoutubeModal(false); setYoutubeUrl('') }} className="p-1.5 hover:bg-gray-200 rounded-none text-gray-500 hover:text-gray-700 transition-colors">
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">URL de la vidéo YouTube</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-field"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Collez l'URL complète YouTube ou un lien partagé (youtu.be/...)</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => { setShowYoutubeModal(false); setYoutubeUrl('') }} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-none transition-colors border border-gray-300">Annuler</button>
              <button
                type="button"
                disabled={!youtubeUrl}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => {
                  const embedUrl = getYoutubeEmbedUrl(youtubeUrl)
                  if (editor && embedUrl) {
                    editor.commands.insertContent({
                      type: 'youtubeVideo',
                      attrs: { src: youtubeUrl, width: '100%', align: 'center' },
                    })
                    setShowYoutubeModal(false)
                    setYoutubeUrl('')
                  } else {
                    toast.error('URL YouTube invalide.')
                  }
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Insérer la vidéo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Input caché pour upload vidéo MP4 */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 50 * 1024 * 1024) {
            toast.error('La vidéo est trop lourde (maximum 50 Mo)')
            return
          }
          setIsUploadingVideo(true)
          toast.loading('Upload de la vidéo en cours...', { id: 'video-upload' })
          try {
            const fd = new FormData()
            fd.append('video', file)
            const res = await apiClient.post('/admin/upload-video', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            const videoUrl = res.data.url
            editor?.commands.insertContent({
              type: 'video',
              attrs: { src: videoUrl, controls: true },
            })
            toast.success('Vidéo insérée !', { id: 'video-upload' })
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Échec de l\'upload vidéo', { id: 'video-upload' })
          } finally {
            setIsUploadingVideo(false)
            if (videoInputRef.current) videoInputRef.current.value = ''
          }
        }}
      />

      {/* Loading indicator */}
      {(isUploading || isUploadingVideo) && (
        <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-sm rounded-none border border-gray-300 px-4 py-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-sept-blue-strong flex items-center gap-2">
            <span className="animate-pulse">●</span> Upload en cours...
          </span>
        </div>
      )}
    </div>
  )
}
