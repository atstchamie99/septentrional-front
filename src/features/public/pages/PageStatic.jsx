import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import NotFound from '@features/public/pages/NotFound'
import { FileText } from 'lucide-react'
import { sanitizeHtml } from '@shared/utils/sanitize'
import MetaTags from '@shared/components/MetaTags'
import { stripHtml } from '@features/public/utils/articles'

export default function PageStatic({ slug: propSlug }) {
  const { slug: paramSlug } = useParams()
  const slug = propSlug || paramSlug
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) loadPage()
  }, [slug])

  const loadPage = async () => {
    setLoading(true)
    setPage(null)
    try {
      const res = await publicApi.getPage(slug)
      setPage(res.data?.data || res.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-20">Chargement...</div>
  if (!page) return <NotFound />

  const directPageSlugs = new Set(['a-propos', 'mentions-legales', 'contact'])
  const canonicalPath = directPageSlugs.has(slug) ? `/${slug}` : `/pages/${slug}`

  return (
    <>
      <MetaTags
        title={page.meta_titre || page.titre}
        description={page.meta_description || stripHtml(page.contenu).slice(0, 180)}
        url={canonicalPath}
      />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-sept-blue-strong" />
          {page.titre}
        </h1>
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.contenu) }}
          />
        </div>
      </div>
    </>
  )
}
