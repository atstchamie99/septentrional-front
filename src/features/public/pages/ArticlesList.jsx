import { Fragment, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import {
  getImage,
  getList,
  getTitle,
  sortCategories,
} from '@features/public/utils/articles'
import { FileText, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'
import { useScrollReveal } from '@shared/hooks/useScrollReveal'

const getMeta = (res) => res.data?.meta || res.data?.data?.meta || null

const getVisiblePages = (currentPage, lastPage) => {
  if (lastPage <= 5) return Array.from({ length: lastPage }, (_, index) => index + 1)

  const pages = new Set([1, lastPage, currentPage])
  if (currentPage > 2) pages.add(currentPage - 1)
  if (currentPage < lastPage - 1) pages.add(currentPage + 1)

  return [...pages].sort((a, b) => a - b)
}

function ArticlesListItemCard({ article, index = 0 }) {
  const [ref, isVisible] = useScrollReveal()
  const image = getImage(article)
  const title = getTitle(article)
  const dateStr = article?.date_publication
    ? new Date(article.date_publication).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${((index ?? 0) % 4) * 80}ms` }}
      className={`reveal-init ${isVisible ? 'reveal-visible' : ''} h-full flex flex-col`}
    >
      <Link
        key={article.id}
        to={`/article/${article.slug}`}
        className="bg-white rounded-none overflow-hidden shadow-sm border border-gray-200 hover:border-sept-blue hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out group flex flex-col justify-between relative h-full flex-1"
      >
        {/* Liseré supérieur bleu qui s'étend à 100% au survol */}
        <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full bg-sept-blue transition-all duration-500 ease-out z-20 pointer-events-none" />

        {/* Effet de reflet lumineux doux au survol */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none z-10" />

        <div className="relative aspect-video max-h-44 sm:max-h-48 overflow-hidden bg-gray-100 shrink-0">
          {image ? (
            <img
              src={image}
              className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-all duration-700 ease-out rounded-none"
              alt={title}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <FileText className="h-8 w-8 text-gray-300" aria-hidden="true" />
            </div>
          )}

          {/* Badge Catégorie */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
            {article.categorie && (
              <span className="text-[9px] sm:text-[10px] bg-sept-ink/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-none font-bold uppercase tracking-wider border border-white/10 group-hover:bg-sept-blue group-hover:scale-105 transition-all duration-300">
                {article.categorie.nom}
              </span>
            )}
            {article.est_alerte && (
              <span className="text-[9px] sm:text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-none font-bold uppercase tracking-wider shadow-sm">
                ALERTE
              </span>
            )}
          </div>

          {/* Voile sombre subtil pour contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400 font-semibold mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {dateStr}
            </div>
            <h2 className="font-serif font-bold text-sm sm:text-[15px] text-gray-900 mb-1.5 line-clamp-2 group-hover:text-sept-blue transition-colors duration-200 leading-snug tracking-tight">
              {title}
            </h2>
            {article.extrait && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-normal">{article.extrait}</p>
            )}
          </div>

          <div className="pt-2.5 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="font-bold text-sept-blue group-hover:text-sept-blue-dark transition-colors inline-flex items-center gap-1 text-[11px]">
              <span>Lire l'article</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
            <span className="text-[9px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-none">
              Info
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function ArticlesList({ fixedCategorySlug = '', title = '', showCategoriesBar = false }) {
  const { slug: categorySlug } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategorySlug = fixedCategorySlug || categorySlug
  const requestedPage = Number(searchParams.get('page'))
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(showCategoriesBar ? '' : activeCategorySlug)

  const anneeParam = searchParams.get('annee')
  const moisParam = searchParams.get('mois')
  const periodeParam = searchParams.get('periode')

  let effectiveAnnee = anneeParam
  let effectiveMois = moisParam
  if (periodeParam && !effectiveAnnee && !effectiveMois) {
    const [pY, pM] = periodeParam.split('-')
    effectiveAnnee = pY
    effectiveMois = pM
  }

  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const scrollAmount = 250 // approximativement 2 catégories
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const loadArticles = async (page = 1) => {
    setLoading(true)
    try {
      const params = { per_page: 12, page, order_by: 'date_publication', order: 'desc' }
      const categoryFilter = showCategoriesBar ? selectedCategory : activeCategorySlug
      if (categoryFilter) params.categorie = categoryFilter
      if (effectiveAnnee) params.annee = Number(effectiveAnnee)
      if (effectiveMois) params.mois = Number(effectiveMois)
      const res = await publicApi.getArticles(params)
      const fetchedArticles = getList(res)
      setArticles(fetchedArticles)
      setMeta(getMeta(res))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await publicApi.getCategories()
      let categories = getList(res)
      categories = sortCategories(categories)
      setAllCategories(categories)
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
    }
  }

  useEffect(() => {
    if (showCategoriesBar) {
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCategoriesBar])

  // Initialiser selectedCategory si la barre est activée
  useEffect(() => {
    if (showCategoriesBar) {
      setSelectedCategory('') // 'A la Une' par défaut
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategorySlug, showCategoriesBar])

  // Recharger les articles quand la catégorie ou le filtre de date change
  useEffect(() => {
    loadArticles(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategorySlug, currentPage, selectedCategory, showCategoriesBar, effectiveAnnee, effectiveMois])

  const pageHref = (page) => {
    if (page <= 1) return location.pathname
    return `${location.pathname}?page=${page}`
  }

  const selectCategory = (slug) => {
    setSearchParams({})
    setSelectedCategory(slug)
  }

  const canonicalUrl = pageHref(currentPage)
  const MOIS_FR = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  const monthName = effectiveMois ? MOIS_FR[Number(effectiveMois)] : ''
  const isArchiveFilter = Boolean(effectiveAnnee && effectiveMois)

  const pageTitle = isArchiveFilter
    ? `Revivez votre mois de : ${monthName} ${effectiveAnnee}`
    : title || (showCategoriesBar && selectedCategory ? `Catégorie: ${selectedCategory}` : activeCategorySlug ? `Catégorie: ${activeCategorySlug}` : 'Actualités')

  if (loading && articles.length === 0) {
    return (
      <>
        <MetaTags
          title={pageTitle}
          description="Retrouvez les dernières actualités, analyses et informations de Septentrional au Togo."
          url={canonicalUrl}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="skeleton h-8 w-48 rounded-none mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="space-y-3 bg-white p-3.5 border border-gray-100 rounded-none animate-pulse">
                <div className="skeleton aspect-video max-h-48 rounded-none" />
                <div className="skeleton h-4 w-3/4 rounded-none" />
                <div className="skeleton h-3 w-1/2 rounded-none" />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <MetaTags
        title={pageTitle}
        description={`Retrouvez les actualités de ${monthName || ''} ${effectiveAnnee || ''} sur Septentrional au Togo.`}
        url={canonicalUrl}
      />
      {/* Header with gradient accent */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="section-title">
          {isArchiveFilter ? (
            <Calendar className="w-6 h-6 text-sept-blue-strong shrink-0" />
          ) : (
            <FileText className="w-6 h-6 text-sept-blue-strong shrink-0" />
          )}
          {pageTitle}
        </h1>

        {isArchiveFilter && (
          <Link
            to="/actualites"
            className="text-xs md:text-sm font-bold text-sept-blue-strong hover:text-sept-blue-dark border border-sept-blue-strong/30 hover:border-sept-blue-strong px-3 py-1.5 rounded-none bg-sept-blue-strong/5 transition-colors flex items-center gap-1.5"
          >
            <span>Toutes les actualités</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Barre de catégories - uniquement si activée */}
      {showCategoriesBar && allCategories.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex-shrink-0 w-8 h-8 rounded-none flex items-center justify-center bg-sept-blue hover:bg-sept-blue-dark text-white shadow-xs transition-all duration-200 cursor-pointer"
            aria-label="Défiler à gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-x-auto scroll-smooth py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => selectCategory('')}
                className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-none transition-all duration-200 flex-shrink-0 cursor-pointer border ${
                  !selectedCategory
                    ? 'bg-sept-blue text-white border-sept-blue font-extrabold shadow-xs'
                    : 'bg-white text-gray-700 hover:text-sept-blue hover:bg-gray-50 border-gray-200'
                }`}
                aria-label="Tous les articles"
              >
                A la Une
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat.slug || cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-none transition-all duration-200 flex-shrink-0 cursor-pointer border ${
                    selectedCategory === cat.slug
                      ? 'bg-sept-blue text-white border-sept-blue font-extrabold shadow-xs'
                      : 'bg-white text-gray-700 hover:text-sept-blue hover:bg-gray-50 border-gray-200'
                  }`}
                  aria-label={`Filtrer par catégorie ${cat.nom}`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex-shrink-0 w-8 h-8 rounded-none flex items-center justify-center bg-sept-blue hover:bg-sept-blue-dark text-white shadow-xs transition-all duration-200 cursor-pointer"
            aria-label="Défiler à droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grille articles — avec animation d'entrée scroll reveal et effets dynamiques */}
      <div
        key={`${selectedCategory || activeCategorySlug || 'all'}-${currentPage}`}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {articles.map((article, i) => (
          <ArticlesListItemCard key={article.id || i} article={article} index={i} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun article trouvé</div>
      )}

      {/* Pagination stylisée */}
      {meta && meta.last_page > 1 && (
        <nav className="mt-8 flex items-center justify-center" aria-label="Pagination">
          <div className="inline-flex items-center gap-1 rounded-none border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
          {/* Précédent */}
          {meta.current_page > 1 && (
            <Link
              to={pageHref(meta.current_page - 1)}
              className="w-8 h-8 rounded-none text-sept-blue-strong flex items-center justify-center hover:bg-sept-blue-strong/10 transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}

          {getVisiblePages(meta.current_page, meta.last_page).map((page, index, pages) => (
            <Fragment key={page}>
              {index > 0 && page - pages[index - 1] > 1 && (
                <span className="px-1 text-xs text-gray-400">
                  ...
                </span>
              )}
              <Link
                to={pageHref(page)}
                aria-current={meta.current_page === page ? 'page' : undefined}
                className={`min-w-8 h-8 rounded-none px-2 text-xs font-semibold transition-all duration-200 flex items-center justify-center ${
                  meta.current_page === page
                    ? 'bg-sept-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-sept-blue-strong/10 hover:text-sept-blue-strong'
                }`}
              >
                {page}
              </Link>
            </Fragment>
          ))}

          {/* Suivant */}
          {meta.current_page < meta.last_page && (
            <Link
              to={pageHref(meta.current_page + 1)}
              className="w-8 h-8 rounded-none text-sept-blue-strong flex items-center justify-center hover:bg-sept-blue-strong/10 transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          </div>
        </nav>
      )}
    </div>
  )
}
