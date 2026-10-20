import { describe, expect, it } from '@jest/globals'
import { sanitizeEditorialStyle, sanitizeHtml } from '../sanitize'

describe('sanitizeEditorialStyle', () => {
  it('keeps only bounded styles emitted by the editor', () => {
    const style = sanitizeEditorialStyle(
      'text-align: justify; color: rgb(59, 130, 246); '
      + 'font-family: Inter; line-height: 1.5; margin-bottom: 1.5rem; '
      + 'position: fixed; background-image: url(https://evil.test/x)',
    )

    expect(style).toContain('text-align: justify')
    expect(style).toContain('color: #3b82f6')
    expect(style).toContain('font-family: Inter')
    expect(style).toContain('line-height: 1.5')
    expect(style).toContain('margin-bottom: 1.5rem')
    expect(style).not.toContain('position')
    expect(style).not.toContain('url(')
  })

  it('rejects arbitrary colors, dimensions and expressions', () => {
    expect(sanitizeEditorialStyle(
      'color: #123456; width: 9999px; height: expression(alert(1))',
    )).toBe('')
  })
})

describe('sanitizeHtml', () => {
  it('preserves safe editorial formatting and canonical media attributes', () => {
    const clean = sanitizeHtml(`
      <p class="isSelectedEnd evil" style="text-align: center; line-height: 2">
        <span style="color: #3b82f6; font-family: Inter">Texte</span>
      </p>
      <div data-video-wrapper data-src="https://media.example/video.mp4"
           data-width="50%" data-align="right" data-unknown="removed">
        <video src="https://media.example/video.mp4"></video>
      </div>
      <div data-video-wrapper data-src="javascript:alert(1)"
           data-width="999px" data-align="diagonal"></div>
      <img src="https://media.example/image.jpg" class="alignright evil">
    `)

    expect(clean).toContain('class="isSelectedEnd"')
    expect(clean).toContain('text-align: center')
    expect(clean).toContain('line-height: 2')
    expect(clean).toContain('color: #3b82f6')
    expect(clean).toContain('font-family: Inter')
    expect(clean).toContain('data-video-wrapper')
    expect(clean).toContain('data-src="https://media.example/video.mp4"')
    expect(clean).toContain('data-width="50%"')
    expect(clean).toContain('data-align="right"')
    expect(clean).not.toContain('data-unknown')
    expect(clean).not.toContain('data-src="javascript:')
    expect(clean).not.toContain('data-width="999px"')
    expect(clean).not.toContain('data-align="diagonal"')
    expect(clean).toContain('class="alignright"')
    expect(clean).toContain('loading="lazy"')
    expect(clean).toContain('decoding="async"')
    expect(clean).toContain('preload="metadata"')
  })

  it('hardens links and trusted video embeds', () => {
    const clean = sanitizeHtml(`
      <a href="https://example.com" target="_blank">Sûr</a>
      <a href="mailto:redaction@example.com">Email</a>
      <a href="tel:+22890000000">Téléphone</a>
      <a href="/article/interne">Interne</a>
      <a href="#section">Ancre</a>
      <a href="//evil.example/path">Protocol-relative</a>
      <a href="javascript:alert(1)" target="_blank">Dangereux</a>
      <iframe src="https://www.youtube.com/embed/abcdefgh"></iframe>
      <iframe src="https://evil.example/embed/abcdefgh"></iframe>
    `)

    expect(clean).toContain('href="https://example.com"')
    expect(clean).toContain('rel="noopener noreferrer"')
    expect(clean).toContain('href="mailto:redaction@example.com"')
    expect(clean).toContain('href="tel:+22890000000"')
    expect(clean).toContain('href="/article/interne"')
    expect(clean).toContain('href="#section"')
    expect(clean).not.toContain('href="//evil.example/path"')
    expect(clean).not.toContain('javascript:')
    expect(clean).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"')
    expect(clean).toContain('referrerpolicy="strict-origin-when-cross-origin"')
    expect(clean).toContain('title="Vidéo intégrée"')
    expect(clean.match(/<iframe/g)).toHaveLength(1)
  })

  it('migrates legacy media flex alignment before removing unsupported styles', () => {
    const clean = sanitizeHtml(`
      <div data-video-wrapper style="display:flex; justify-content:flex-end">
        <video src="https://media.example/legacy.mp4"></video>
      </div>
      <div data-youtube-wrapper style="display:flex; justify-content:flex-start">
        <iframe src="https://www.youtube.com/embed/abcdefgh"></iframe>
      </div>
    `)

    expect(clean).toContain('data-video-wrapper')
    expect(clean).toContain('data-align="right"')
    expect(clean).toContain('data-youtube-wrapper')
    expect(clean).toContain('data-align="left"')
    expect(clean).not.toContain('justify-content')
    expect(clean).not.toContain('display:')
  })

  it('keeps only bounded table column width lists', () => {
    const tooManyWidths = Array.from({ length: 33 }, () => '100').join(',')
    const clean = sanitizeHtml(`
      <table><tbody><tr>
        <th colspan="2" colwidth="120, 240">Conservé</th>
        <td colwidth="100px">Malformé</td>
        <td colwidth="4097">Démesuré</td>
        <td colwidth="${tooManyWidths}">Trop long</td>
      </tr></tbody></table>
    `)

    expect(clean).toContain('colwidth="120,240"')
    expect(clean).not.toContain('colwidth="100px"')
    expect(clean).not.toContain('colwidth="4097"')
    expect(clean).not.toContain(tooManyWidths)
  })

  it('removes executable markup and event handlers', () => {
    const clean = sanitizeHtml(
      '<script>alert(1)</script><img src="x" onerror="alert(2)"><p onclick="alert(3)">Texte</p>',
    )

    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onerror')
    expect(clean).not.toContain('onclick')
    expect(clean).toContain('Texte')
  })
})
