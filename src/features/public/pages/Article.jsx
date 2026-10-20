// src/pages/public/Article.jsx
import { useState, useEffect } from 'react'
import { sanitizeHtml } from '@shared/utils/sanitize'
import { useParams, Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { Calendar, MessageCircle, Send, ChevronDown, User } from 'lucide-react'
import FlashInfoBar from '@features/public/components/FlashInfoBar'
import NotFound from '@features/public/pages/NotFound'
import { getImage, stripHtml, getCategoryLabel } from '@features/public/utils/articles'
import ShareButton from '@shared/components/ShareButton/ShareButton'
import MetaTags from '@shared/components/MetaTags'
import Breadcrumbs from '@shared/components/Breadcrumbs'
import toast from 'react-hot-toast'

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [commentaires, setCommentaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentForm, setCommentForm] = useState({ nom: '', email: '', contenu: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [popularArticles, setPopularArticles] = useState([])
  const [flashInfos, setFlashInfos] = useState([])

  async function loadArticle() {
    try {
      const res = await publicApi.getArticle(slug)
      const articleData = res.data?.data || res.data
      setArticle(articleData)

      // Charger les commentaires séparément
      try {
        const commRes = await publicApi.getCommentairesArticle(slug)
        let commData = commRes.data?.data || commRes.data || []
        // S'assurer que c'est un tableau
        if (!Array.isArray(commData)) {
          commData = []
        }
        setCommentaires(commData)
      } catch (commError) {
        console.error('Erreur chargement commentaires:', commError)
        setCommentaires([])
      }

      // 3 derniers articles ajoutés (sidebar), en excluant l'article courant
      try {
        const popRes = await publicApi.getArticles({ 
          per_page: 3, 
          exclude: articleData?.id, 
          order_by: 'date_publication', 
          order: 'desc' 
        })
        const popData = popRes.data?.data || popRes.data || []
        setPopularArticles(Array.isArray(popData) ? popData : [])
      } catch (popError) {
        console.error('Erreur chargement derniers articles:', popError)
        setPopularArticles([])
      }

      // Flash infos
      try {
        const flashRes = await publicApi.getFlashInfos()
        const flashData = flashRes.data?.data || flashRes.data || []
        setFlashInfos(Array.isArray(flashData) ? flashData : [])
      } catch (flashError) {
        console.error('Erreur chargement flash infos:', flashError)
        setFlashInfos([])
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticle()
  }, [slug])

  const siteUrl = 'https://septentrional.tg'
  const articleUrl = article ? `${siteUrl}/article/${article.slug}` : ''

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await publicApi.postCommentaire({
        ...commentForm,
        commentable_type: 'App\\Models\\Article',
        commentable_id: article.id,
      })
      setCommentForm({ nom: '', email: '', contenu: '' })
      // Recharger les commentaires
      const res = await publicApi.getCommentairesArticle(slug)
      setCommentaires(res.data?.data || res.data || [])
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20">Chargement...</div>
  if (!article) return <NotFound />

  const hasUsableMetaTitle =
    article.meta_titre &&
    !String(article.meta_titre).includes('%%')
  const seoTitle = hasUsableMetaTitle ? article.meta_titre : article.titre
  const seoDescription = stripHtml(
    article.meta_description || article.extrait || `Lire l'article: ${article.titre}`,
  )
  const seoImage = getImage(article) || undefined
  // La signature est un choix éditorial : on ne doit pas afficher le compte
  // interne de l'auteur si le champ dédié n'a pas été renseigné.
  const authorName = String(article.redacteur_nom || '').trim() || null
  const sanitizedContent = sanitizeHtml(article.contenu)
  const hasVisibleContent = sanitizedContent.trim().length > 0
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titre,
    description: seoDescription,
    ...(seoImage ? { image: [seoImage] } : {}),
    datePublished: article.date_publication || article.created_at,
    dateModified: article.updated_at || article.date_publication || article.created_at,
    mainEntityOfPage: articleUrl,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Septentrional',
    },
  }

  return (
    <div>
      <MetaTags
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={articleUrl}
        type="article"
        imageAlt={article.titre}
        publishedTime={article.date_publication || article.created_at}
        modifiedTime={article.updated_at}
        structuredData={structuredData}
      />

      <FlashInfoBar flashInfos={flashInfos} />
      <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contenu principal */}
        <article className="lg:w-2/3">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={[
              { label: 'Accueil', path: '/' },
              { label: 'Actualités', path: '/actualites' },
              ...(article.categorie?.slug
                ? [{ label: getCategoryLabel(article), path: `/categorie/${article.categorie.slug}` }]
                : []),
              { label: article.titre || 'Article' },
            ]}
          />

          {/* Image principale */}
          {getImage(article) && (
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg mb-6 bg-gray-100">
              <img
                src={getImage(article)}
                alt={article.titre || 'Septentrional'}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          )}

          {/* Titre et méta */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-gray-900 leading-tight mb-4">{article.titre}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {authorName && (
              <span className="flex items-center gap-1 font-medium text-sept-blue-strong">
                <User className="w-4 h-4" />
                Par {authorName}
              </span>
            )}
            {article.date_publication && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.date_publication).toLocaleDateString('fr-FR')}
              </span>
            )}
            {article.est_alerte && (
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                🚨 ALERTE
              </span>
            )}
          </div>

          {/* Catégorie et tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {article.categorie?.slug && (
              <Link 
                to={`/categorie/${article.categorie.slug}`} 
                className="bg-sept-blue-strong text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-sept-blue-dark transition"
              >
                {getCategoryLabel(article)}
              </Link>
            )}
            {Array.isArray(article.etiquettes) && article.etiquettes.map((tag) => {
              const tagName = typeof tag?.nom === 'string' ? tag.nom : typeof tag?.name === 'string' ? tag.name : ''
              if (!tagName) return null
              return (
                <span key={tag.id || tagName} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  #{tagName}
                </span>
              )
            })}
          </div>

          {/* Contenu */}
          {hasVisibleContent ? (
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8 tiptap-content"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Contenu indisponible.
            </div>
          )}

          {/* Partage */}
          <div className="flex items-center justify-end py-4 border-t border-b border-gray-200 mb-8">
            <ShareButton
              url={articleUrl}
              title={article.titre}
              description={seoDescription}
              imageUrl={seoImage}
            >
              Partager l'article
            </ShareButton>
          </div>

          {/* Commentaires */}
          <section className="bg-white rounded-none border border-gray-200 shadow-sm p-6">
            <button 
              onClick={() => setShowComments(!showComments)}
              className="w-full flex items-center justify-between text-lg font-serif font-bold text-gray-900 focus:outline-none group"
            >
              <div className="flex items-center gap-2 group-hover:text-sept-blue-strong transition-colors">
                <MessageCircle className="w-5 h-5 text-sept-blue-strong" />
                Commentaires ({commentaires.length})
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 group-hover:text-sept-blue-strong transition-transform duration-300 ${showComments ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showComments ? 'max-h-[5000px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
            {/* Liste commentaires */}
            <div className="space-y-4 mb-6">
              {Array.isArray(commentaires) && commentaires.length > 0 ? (
                commentaires.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-sept-blue-strong/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-sept-blue-strong" />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-800">{comment.nom || 'Anonyme'}</span>
                        {comment.created_at && (
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {comment.statut !== 'approuve' && comment.statut !== 'approuvé' && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">
                          {comment.statut}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 ml-10">{comment.contenu || ''}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire. Soyez le premier !</p>
              )}
            </div>

            {/* Formulaire commentaire */}
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Laisser un commentaire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={commentForm.nom}
                  onChange={(e) => setCommentForm({...commentForm, nom: e.target.value})}
                  className="input-field"
                  required
                />
                <input
                  type="email"
                  placeholder="Votre email (non affiché)"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <textarea
                placeholder="Votre commentaire..."
                value={commentForm.contenu}
                onChange={(e) => setCommentForm({...commentForm, contenu: e.target.value})}
                className="input-field min-h-[100px]"
                required
              />
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:w-1/3 space-y-6">
          {/* Articles suggérés */}
          {popularArticles.length > 0 && (
            <div className="bg-white rounded-none border border-gray-200 shadow-sm p-4">
              <h3 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-100 pb-2">Articles récents</h3>
              <div className="space-y-3">
                {popularArticles.map((pop, idx) => (
                  <Link
                    key={pop.id}
                    to={`/article/${pop.slug}`}
                    className="flex items-center gap-3 group p-1.5 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 animate-card-entrance rounded-none"
                    style={{ animationDelay: `${(idx % 6) * 60}ms` }}
                  >
                    {getImage(pop) && (
                      <div className="w-14 h-14 rounded-none overflow-hidden shrink-0 bg-gray-100">
                        <img
                          src={getImage(pop)}
                          alt={pop.titre}
                          className="w-full h-full rounded-none object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-serif font-bold text-gray-800 group-hover:text-sept-blue transition-colors line-clamp-2 leading-snug">
                        {pop.titre}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>
      </div>
    </div>
  )
}
