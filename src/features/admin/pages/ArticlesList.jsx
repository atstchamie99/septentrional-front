import { Fragment, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { Plus, Edit, Trash2, FileText, Eye, CheckCircle, Archive, ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveImageUrl } from '@features/public/utils/articles'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

const getVisiblePages = (currentPage, lastPage) => {
  if (lastPage <= 5) return Array.from({ length: lastPage }, (_, i) => i + 1)

  const pages = new Set([1, lastPage, currentPage])
  if (currentPage > 2) pages.add(currentPage - 1)
  if (currentPage < lastPage - 1) pages.add(currentPage + 1)

  return [...pages].sort((a, b) => a - b)
}

export default function ArticlesList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { loadArticles(page) }, [page])

  const loadArticles = async (p = 1) => {
    try {
      const res = await adminApi.getArticles({ page: p, per_page: 20 })
      setArticles(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cet article ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteArticle(id)
      loadArticles()
    } catch (error) { toast.error('Erreur lors de la suppression.') }
  }

  const handlePublier = async (id) => {
    try {
      await adminApi.publierArticle(id)
      loadArticles()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleArchiver = async (id) => {
    try {
      await adminApi.archiverArticle(id)
      loadArticles()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const getStatusBadge = (statut) => {
    const styles = {
      publie: 'bg-green-50 text-green-700 border-green-300',
      brouillon: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      archive: 'bg-gray-50 text-gray-700 border-gray-300',
    }
    return styles[statut] || 'bg-gray-50 text-gray-700 border-gray-300'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-48 rounded-none" />
          <div className="skeleton h-10 w-32 rounded-none" />
        </div>
        <div className="skeleton h-96 w-full rounded-none" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
            Publication
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-sept-blue-strong" />
            Articles
          </h1>
        </div>
        <Link to="/management/septentrional/articles/nouveau" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-wider text-xs font-bold py-2.5 rounded-none">
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Titre</th>
                <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Catégorie</th>
                <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Statut</th>
                <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600 hidden sm:table-cell">Date</th>
                <th className="px-6 py-3.5 text-right text-xs uppercase font-bold tracking-wider text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {article.image_principale ? (
                        <img src={resolveImageUrl(article.image_principale)} alt="" className="w-10 h-10 rounded-none object-cover shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/management/septentrional/articles/${article.id}/edit`} className="font-medium text-gray-900 hover:text-sept-blue-strong transition-colors block truncate max-w-[200px] md:max-w-[300px]">
                          {article.titre}
                        </Link>
                        {article.est_alerte && <span className="inline-block mt-1 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-none font-bold uppercase tracking-wider border border-red-200">ALERTE</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">{article.categorie?.nom || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(article.statut)}`}>
                      {article.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 hidden sm:table-cell font-medium">
                    {article.date_publication ? new Date(article.date_publication).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/article/${article.slug}`} target="_blank" className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-none border border-transparent hover:border-gray-200 transition-colors" title="Voir sur le site">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {article.statut === 'brouillon' && (
                        <button onClick={() => handlePublier(article.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-none border border-transparent hover:border-green-200 transition-colors" title="Publier">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {article.statut === 'publie' && (
                        <button onClick={() => handleArchiver(article.id)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-none border border-transparent hover:border-gray-200 transition-colors" title="Archiver">
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <Link to={`/management/septentrional/articles/${article.id}/edit`} className="p-1.5 text-sept-blue-strong hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-200 transition-colors" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </Link>
                      {isAdmin() && (
                        <button onClick={() => handleDelete(article.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {articles.length === 0 && (
          <div className="text-center py-12 text-gray-400 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm">Aucun article trouvé</p>
          </div>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <nav className="flex items-center justify-center" aria-label="Pagination">
          <div className="inline-flex items-center gap-1 rounded-none border border-gray-200 bg-white p-1 shadow-sm">
            {meta.current_page > 1 && (
              <button
                onClick={() => setPage(meta.current_page - 1)}
                className="w-8 h-8 rounded-none text-sept-blue-strong flex items-center justify-center hover:bg-sept-blue-strong/10 transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {getVisiblePages(meta.current_page, meta.last_page).map((p, index, pages) => (
              <Fragment key={p}>
                {index > 0 && p - pages[index - 1] > 1 && (
                  <span className="px-1 text-xs text-gray-400">...</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`min-w-8 h-8 rounded-none px-2.5 text-xs font-semibold transition-all duration-150 ${
                    meta.current_page === p
                      ? 'bg-sept-blue-strong text-white font-bold shadow-sm'
                      : 'text-gray-600 hover:bg-sept-blue-strong/10 hover:text-sept-blue-strong'
                  }`}
                >
                  {p}
                </button>
              </Fragment>
            ))}

            {meta.current_page < meta.last_page && (
              <button
                onClick={() => setPage(meta.current_page + 1)}
                className="w-8 h-8 rounded-none text-sept-blue-strong flex items-center justify-center hover:bg-sept-blue-strong/10 transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
