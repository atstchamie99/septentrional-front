import { describe, expect, it } from '@jest/globals'
import { Editor } from '@tiptap/core'
import LinkExtension from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import { normalizeTableColumnWidths } from '@shared/utils/editorialAttributes'
import {
  applySafeLinkToEditor,
  getYoutubeEmbedUrl,
  normalizeSafeLink,
  ResizableImage,
  SafeTableCell,
  SafeTableHeader,
  VideoNode,
  YoutubeNode,
} from '../extensions/editorContent'

const getMediaNodes = (editor: Editor) => (
  editor.getJSON().content?.filter(node => ['video', 'youtubeVideo'].includes(node.type)) || []
)

const collectNodes = (node: any, type: string): any[] => [
  ...(node.type === type ? [node] : []),
  ...(node.content?.flatMap((child: any) => collectNodes(child, type)) || []),
]

describe('Tiptap media round-trip', () => {
  it('preserves source, width and alignment through HTML serialization', () => {
    const source = `
      <div data-video-wrapper="" data-src="https://media.example/video.mp4"
           data-width="50%" data-align="right">
        <video src="https://media.example/video.mp4" controls></video>
      </div>
      <div data-youtube-wrapper="" data-src="https://youtu.be/abcdefgh"
           data-width="75%" data-align="left">
        <iframe src="https://www.youtube.com/embed/abcdefgh"></iframe>
      </div>
    `

    const editor = new Editor({
      extensions: [StarterKit, VideoNode, YoutubeNode],
      content: source,
    })

    const firstPass = getMediaNodes(editor)
    expect(firstPass[0]?.attrs).toMatchObject({
      src: 'https://media.example/video.mp4',
      width: '50%',
      align: 'right',
    })
    expect(firstPass[1]?.attrs).toMatchObject({
      src: 'https://youtu.be/abcdefgh',
      width: '75%',
      align: 'left',
    })

    const serialized = editor.getHTML()
    expect(serialized).toContain('data-src="https://media.example/video.mp4"')
    expect(serialized).toContain('data-width="50%"')
    expect(serialized).toContain('data-align="right"')
    expect(serialized).toContain('data-src="https://youtu.be/abcdefgh"')

    const reloaded = new Editor({
      extensions: [StarterKit, VideoNode, YoutubeNode],
      content: serialized,
    })
    const secondPass = getMediaNodes(reloaded)

    expect(secondPass.map(node => node.attrs)).toEqual(firstPass.map(node => node.attrs))

    editor.destroy()
    reloaded.destroy()
  })

  it('migrates legacy flex alignment to canonical data attributes', () => {
    const editor = new Editor({
      extensions: [StarterKit, VideoNode, YoutubeNode],
      content: `
        <div data-video-wrapper style="display:flex; justify-content:flex-end">
          <video src="https://media.example/legacy.mp4" style="width:50%"></video>
        </div>
        <div data-youtube-wrapper style="display:flex; justify-content:flex-start">
          <iframe src="https://www.youtube.com/embed/abcdefgh" style="width:75%"></iframe>
        </div>
      `,
    })

    const media = getMediaNodes(editor)
    expect(media[0]?.attrs).toMatchObject({ align: 'right', width: '50%' })
    expect(media[1]?.attrs).toMatchObject({ align: 'left', width: '75%' })

    const serialized = editor.getHTML()
    expect(serialized).toContain('data-align="right"')
    expect(serialized).toContain('data-align="left"')
    expect(serialized).not.toContain('justify-content')

    const reloaded = new Editor({
      extensions: [StarterKit, VideoNode, YoutubeNode],
      content: serialized,
    })
    expect(getMediaNodes(reloaded).map(node => node.attrs))
      .toEqual(media.map(node => node.attrs))

    editor.destroy()
    reloaded.destroy()
  })
})

describe('Tiptap URL validation', () => {
  it.each([
    'https://septentrional.tg/actualites',
    'http://septentrional.tg',
    'mailto:contact@septentrional.tg',
    'tel:+22890000000',
    '/article/une-actualite',
    '#section-2',
  ])('accepts the supported link %s', value => {
    expect(normalizeSafeLink(value)).toBe(value)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.test/file',
    '//evil.test/path',
    '/\\evil.test/path',
    'not-a-url',
  ])('rejects the unsafe or unsupported link %s', value => {
    expect(normalizeSafeLink(value)).toBeNull()
  })

  it('normalizes supported YouTube URLs and rejects lookalike hosts', () => {
    expect(getYoutubeEmbedUrl('https://youtu.be/abcdefghijk'))
      .toBe('https://www.youtube.com/embed/abcdefghijk')
    expect(getYoutubeEmbedUrl('https://youtube.com/watch?v=abcdefghijk'))
      .toBe('https://www.youtube.com/embed/abcdefghijk')
    expect(getYoutubeEmbedUrl('https://youtube.com.evil.test/watch?v=abcdefghijk'))
      .toBeNull()
  })

  it('updates the mark around a cursor inside an existing link', () => {
    const editor = new Editor({
      extensions: [StarterKit, LinkExtension],
      content: '<p>Avant <a href="https://old.example">libellé existant</a> après</p>',
    })

    editor.commands.setTextSelection(10)
    expect(editor.isActive('link')).toBe(true)
    expect(applySafeLinkToEditor(editor, '/article/nouveau')).toBe(true)

    const html = editor.getHTML()
    expect(html).toContain('href="/article/nouveau"')
    expect(html).toContain('>libellé existant</a>')
    expect(html).not.toContain('https://old.example')
    expect(editor.getText()).not.toContain('/article/nouveau')

    editor.destroy()
  })
})

describe('Tiptap legacy images', () => {
  it('preserves legacy class alignment and bounded style/attribute widths', () => {
    const editor = new Editor({
      extensions: [StarterKit, ResizableImage],
      content: `
        <p><img src="https://media.example/left.jpg"
                class="alignleft size-large" style="width:50%"></p>
        <p><img src="https://media.example/right.jpg"
                class="alignright" width="75%" style="width:9999px"></p>
        <p><img src="https://media.example/center.jpg"
                class="aligncenter" style="width:25%"></p>
        <p><img src="https://media.example/invalid-width.jpg"
                class="alignleft" width="9999" style="width:80%"></p>
      `,
    })

    const firstPass = collectNodes(editor.getJSON(), 'image').map(node => node.attrs)
    expect(firstPass).toEqual([
      expect.objectContaining({ align: 'left', width: '50%' }),
      expect.objectContaining({ align: 'right', width: '75%' }),
      expect.objectContaining({ align: 'center', width: '25%' }),
      expect.objectContaining({ align: 'left', width: '100%' }),
    ])

    const serialized = editor.getHTML()
    expect(serialized).toContain('data-align="left"')
    expect(serialized).toContain('width="50%"')
    expect(serialized).toContain('data-align="right"')
    expect(serialized).toContain('width="75%"')
    expect(serialized).not.toContain('width: 9999px')
    expect(serialized).not.toContain('width: 80%')
    expect(serialized).not.toContain('width="9999"')

    const reloaded = new Editor({
      extensions: [StarterKit, ResizableImage],
      content: serialized,
    })
    const secondPass = collectNodes(reloaded.getJSON(), 'image').map(node => node.attrs)

    expect(secondPass).toEqual(firstPass)

    editor.destroy()
    reloaded.destroy()
  })
})

describe('Tiptap table column widths', () => {
  const tableExtensions = [
    StarterKit,
    Table.configure({ resizable: true }),
    TableRow,
    SafeTableCell,
    SafeTableHeader,
  ]

  it('preserves a valid width list through serialization and reload', () => {
    const editor = new Editor({
      extensions: tableExtensions,
      content: `
        <table><tbody>
          <tr><th colspan="2" colwidth="120, 240"><p>Titre</p></th></tr>
          <tr><td><p>A</p></td><td><p>B</p></td></tr>
        </tbody></table>
      `,
    })

    const firstHeader = collectNodes(editor.getJSON(), 'tableHeader')[0]
    expect(firstHeader?.attrs.colwidth).toEqual([120, 240])

    const serialized = editor.getHTML()
    expect(serialized).toContain('colwidth="120,240"')

    const reloaded = new Editor({
      extensions: tableExtensions,
      content: serialized,
    })
    expect(collectNodes(reloaded.getJSON(), 'tableHeader')[0]?.attrs.colwidth)
      .toEqual([120, 240])

    editor.destroy()
    reloaded.destroy()
  })

  it.each([
    '0',
    '-10',
    '100px',
    '4097',
    '100,,200',
    Array.from({ length: 33 }, () => '100').join(','),
  ])('rejects malformed or oversized colwidth %s', value => {
    expect(normalizeTableColumnWidths(value)).toBeNull()
  })
})
