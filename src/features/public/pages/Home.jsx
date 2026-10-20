import { useEffect, useMemo, useState, useRef } from 'react'
import { preload } from 'react-dom'
import { Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import {
  articleMatchesCategory,
  getCategoryLabel,
  getCategorySlug,
  getImage,
  getList,
  getTitle,
  normalizeText,
  resolveImageUrl,
  sortCategories,
  stripHtml,
} from '@features/public/utils/articles'
import { useCategory } from '@features/public/contexts/CategoryContext'
import { useSiteSettings } from '@features/public/contexts/SiteSettingsContext'
import TodayInfoSection from '@features/public/components/TodayInfoSection'
import FlashInfoBar from '@features/public/components/FlashInfoBar'
import { useScrollReveal } from '@shared/hooks/useScrollReveal'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  FileText,
  Landmark,
  Scale,
  Play,
  Pause,
} from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'

/* ============================================
   Section Colonne : Présidence du Conseil & Justice
   (Grandes cartes + Défilement automatique + Pause au survol)
   ============================================ */
function PresidenceJusticeColumn({
  presidenceArticles = [],
  justiceArticles = [],
  presidenceSlug = 'presidence-du-conseil',
  justiceSlug = 'justice',
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState('justice')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartYRef = useRef(0)

  const displayArticles = useMemo(() => {
    const list = activeTab === 'presidence' ? presidenceArticles : justiceArticles
    return Array.isArray(list) ? list.filter(Boolean) : []
  }, [activeTab, presidenceArticles, justiceArticles])

  // Défilement automatique toutes les 4.5 secondes (avec pause au survol)
  useEffect(() => {
    if (isPaused || displayArticles.length <= 1) return undefined

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [isPaused, displayArticles.length])

  const handlePrev = (e) => {
    e?.preventDefault()
    if (!displayArticles.length) return
    setCurrentIndex((prev) => (prev - 1 + displayArticles.length) % displayArticles.length)
  }

  const handleNext = (e) => {
    e?.preventDefault()
    if (!displayArticles.length) return
    setCurrentIndex((prev) => (prev + 1) % displayArticles.length)
  }

  const handleTouchStart = (e) => {
    setIsPaused(true)
    touchStartYRef.current = e.targetTouches[0].clientY
  }

  const handleTouchEnd = (e) => {
    setIsPaused(false)
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartYRef.current - touchEndY
    if (diff > 40) {
      handleNext()
    } else if (diff < -40) {
      handlePrev()
    }
  }

  const targetCategoryLink =
    activeTab === 'justice'
      ? `/categorie/${justiceSlug}`
      : `/categorie/${presidenceSlug}`

  return (
    <div
      className="w-full lg:w-[32%] xl:w-[30%] lg:max-w-sm bg-white border border-gray-200 shadow-sm p-3 sm:p-3.5 flex flex-col justify-between animate-fade-in-up relative overflow-hidden rounded-none min-h-[420px] lg:h-[450px]"
      style={{ animationDelay: '0.2s' }}
    >
      {/* Liseré supérieur décoratif */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-sept-blue z-20" />

      {/* Header : Titre "Présidence et Justice" sans icône, sans sous-titre, sans décompte, avec flèches haut / bas */}
      <div className="shrink-0 pt-0.5">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <h3 className="font-serif font-bold text-base md:text-lg text-gray-900 tracking-tight leading-tight truncate">
            Présidence et Justice
          </h3>

          {/* Navigation manuelle haut / bas */}
          {displayArticles.length > 1 && (
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 bg-white hover:bg-sept-blue hover:text-white text-gray-700 transition-colors rounded-none"
                aria-label="Article précédent"
                title="Article précédent"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 flex items-center justify-center border border-l-0 border-gray-200 bg-white hover:bg-sept-blue hover:text-white text-gray-700 transition-colors rounded-none"
                aria-label="Article suivant"
                title="Article suivant"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Boutons d'onglets (Justice en premier, puis Présidence, sans "Tout") */}
        <div className="flex border-b border-gray-200 mt-2">
          <button
            type="button"
            onClick={() => { setActiveTab('justice'); setCurrentIndex(0); }}
            className={`flex-1 py-1.5 text-center text-xs font-black transition-all duration-200 border-b-2 truncate rounded-none ${
              activeTab === 'justice'
                ? 'border-sept-blue text-sept-blue bg-sept-blue/5'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Rubrique Justice"
          >
            Justice ({justiceArticles.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('presidence'); setCurrentIndex(0); }}
            className={`flex-1 py-1.5 text-center text-xs font-black transition-all duration-200 border-b-2 truncate rounded-none ${
              activeTab === 'presidence'
                ? 'border-sept-blue text-sept-blue bg-sept-blue/5'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Présidence du Conseil"
          >
            Présidence ({presidenceArticles.length})
          </button>
        </div>
      </div>

      {/* Conteneur Carrousel avec défilement vertical haut / bas */}
      <div
        className="relative flex-1 overflow-hidden my-2 min-h-[280px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="w-full p-3 bg-gray-50 border border-gray-100 animate-pulse space-y-2 rounded-none h-full">
            <div className="w-full aspect-[16/9] max-h-32 bg-gray-200 rounded-none" />
            <div className="h-3 bg-gray-200 w-1/3" />
            <div className="h-4 bg-gray-200 w-3/4" />
            <div className="h-3 bg-gray-200 w-full" />
          </div>
        ) : displayArticles.length > 0 ? (
          displayArticles.map((article, idx) => {
            if (!article) return null
            const activeIndex = displayArticles.length > 0 ? currentIndex % displayArticles.length : 0
            const isCurrent = idx === activeIndex
            const isJustice = activeTab === 'justice'
            const image = getImage(article)
            const title = getTitle(article)
            const rawText = article?.extrait || article?.meta_description || article?.description || article?.contenu || ''
            const cleanText = stripHtml(rawText).trim()
            const excerpt = cleanText ? (cleanText.length > 115 ? `${cleanText.substring(0, 115)}...` : cleanText) : ''
            const dateStr = (article?.date_publication || article?.created_at)
              ? new Date(article.date_publication || article.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null
            const categoryLabel = isJustice ? 'Justice' : 'Présidence du Conseil'
            const link = article?.slug ? `/article/${article.slug}` : '/actualites'

            return (
              <div
                key={article?.id || article?.slug || idx}
                className={`absolute inset-0 flex items-stretch transition-all duration-500 ease-in-out ${
                  isCurrent
                    ? 'opacity-100 translate-y-0 pointer-events-auto z-10'
                    : idx < activeIndex
                    ? 'opacity-0 -translate-y-full pointer-events-none z-0'
                    : 'opacity-0 translate-y-full pointer-events-none z-0'
                }`}
              >
                {/* Card bien proportionnée qui épouse parfaitement la bande */}
                <div className="w-full bg-white border border-gray-200 shadow-xs p-2.5 sm:p-3 flex flex-col justify-between h-full">
                  {/* Image de l'article avec badge */}
                  <Link
                    to={link}
                    className="block group/img relative overflow-hidden bg-gray-100 border border-gray-200 aspect-[16/9] max-h-32 sm:max-h-34 shrink-0 rounded-none shadow-xs"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105 rounded-none"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-gray-400">
                        {isJustice ? (
                          <Scale className="w-8 h-8 text-amber-600/70 mb-1" />
                        ) : (
                          <Landmark className="w-8 h-8 text-sept-blue-strong/70 mb-1" />
                        )}
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {categoryLabel}
                        </span>
                      </div>
                    )}

                    {/* Badge de catégorie superposé sur l'image */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 tracking-wider shadow-sm rounded-none ${
                          isJustice
                            ? 'bg-amber-600 text-white'
                            : 'bg-sept-blue text-white'
                        }`}
                      >
                        {isJustice ? <Scale className="w-2.5 h-2.5" /> : <Landmark className="w-2.5 h-2.5" />}
                        {categoryLabel}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
                  </Link>

                  {/* Corps de la carte */}
                  <div className="flex-1 flex flex-col justify-between pt-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold mb-1">
                        {dateStr && <span>{dateStr}</span>}
                        {article.redacteur_nom && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{article.redacteur_nom}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-sept-blue font-bold">À la une</span>
                      </div>

                      <Link to={link} className="group/title block">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-gray-900 group-hover/title:text-sept-blue transition-colors line-clamp-2 leading-snug tracking-tight">
                          {title}
                        </h4>
                      </Link>

                      {excerpt ? (
                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                          {excerpt}
                        </p>
                      ) : null}
                    </div>

                    {/* Bouton d'action "Lire l'article" */}
                    <div className="pt-2 mt-auto border-t border-gray-100 flex items-center justify-between">
                      <Link
                        to={link}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-sept-blue hover:text-sept-blue-dark transition-colors group/read"
                      >
                        <span>Lire l'article</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setIsPaused((prev) => !prev)
                        }}
                        className="text-[10px] text-gray-500 hover:text-gray-900 font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors rounded-none"
                        title={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
                      >
                        {isPaused ? <Play className="w-2.5 h-2.5 text-sept-blue" /> : <Pause className="w-2.5 h-2.5" />}
                        <span>{isPaused ? 'Reprendre' : 'Pause'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 py-8 text-gray-400">
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center mb-2 border border-gray-200 rounded-none">
              {activeTab === 'justice' ? (
                <Scale className="w-5 h-5 text-gray-400" />
              ) : (
                <Landmark className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-xs font-bold text-gray-700 mb-1">
              Aucun article récent
            </p>
            <p className="text-[11px] text-gray-400 max-w-[200px]">
              {activeTab === 'justice'
                ? 'Pas encore de publication dans la rubrique Justice'
                : 'Pas encore de publication pour la Présidence du Conseil'}
            </p>
          </div>
        )}
      </div>

      {/* Pied : Ligne de progression / tirets cliquables + Lien vers la rubrique */}
      <div className="shrink-0 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* Tirets de pagination cliquables */}
        {displayArticles.length > 1 && (
          <div className="flex items-center gap-1">
            {displayArticles.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all duration-300 rounded-none ${
                  idx === currentIndex
                    ? 'w-6 bg-sept-blue'
                    : 'w-2 bg-gray-200 hover:bg-gray-400'
                }`}
                aria-label={`Article ${idx + 1}`}
                title={`Aller à l'article ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <Link
          to={targetCategoryLink}
          className="flex items-center gap-1 text-[11px] font-black text-sept-blue hover:text-sept-blue-dark transition-colors ml-auto group"
        >
          <span className="truncate">
            {activeTab === 'justice'
              ? 'Rubrique Justice'
              : 'Rubrique Présidence'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  )
}

/* ============================================
   Helper Vidéos & YouTube (Lecture directe sur la même page)
   ============================================ */
function getEmbedUrl(video) {
  if (!video) return null
  const url = video.url_video || video.video_url || video.embed_url || ''
  if (!url) return null

  // YouTube match (watch?v=, embed/, shorts/, youtu.be/)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  if (video.embed_url) return video.embed_url
  return null
}

function getVideoSourceUrl(video) {
  if (!video) return null
  if (getEmbedUrl(video)) return null
  return video.url_video || video.file_url || video.video_url || video.fichier_url || video.video_path || null
}

function getVideoThumbnail(video) {
  const directImage = getImage(video) || video.miniature || video.miniature_url || video.image
  if (directImage) return resolveImageUrl(directImage)

  const url = video.url_video || video.video_url || ''
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  }
  return null
}

/* ============================================
   Section Vidéos & YouTube (Sans fond noir, sans titre)
   ============================================ */
function VideoCard({ video, index = 0 }) {
  const [ref, isVisible] = useScrollReveal()
  const embedUrl = getEmbedUrl(video)
  const videoSourceUrl = getVideoSourceUrl(video)
  const thumbnail = getVideoThumbnail(video)
  const title = getTitle(video)
  const rawDesc = video?.description || video?.extrait || video?.contenu || ''
  const description = typeof rawDesc === 'string'
    ? rawDesc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
    : ''
  const caption = description || title

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index % 3) * 110}ms` }}
      className={`reveal-init ${isVisible ? 'reveal-visible' : ''} flex flex-col group h-full`}
    >
      {/* Cadre vidéo 16:9 à angle droit avec effet hover dynamique */}
      <div className="relative aspect-video w-full bg-black border border-gray-200 group-hover:border-sept-blue rounded-none overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 ease-out">
        {/* Liseré supérieur bleu qui s'étend à 100% au survol */}
        <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full bg-sept-blue transition-all duration-500 ease-out z-20 pointer-events-none" />

        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={title}
          />
        ) : videoSourceUrl ? (
          <video
            src={videoSourceUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            poster={thumbnail || undefined}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-white/40">
            <i className="fab fa-youtube text-5xl"></i>
          </div>
        )}
      </div>

      {/* Légende en italique centrée sous la vidéo avec survol dynamique */}
      <p className="mt-3 text-center italic text-gray-700 group-hover:text-sept-blue text-xs md:text-sm leading-snug px-1 font-serif line-clamp-2 transition-colors duration-200">
        {caption}
      </p>
    </div>
  )
}

function HomeVideosSection({ videos = [] }) {
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 3
  const totalPages = Math.ceil(videos.length / pageSize)

  if (!videos || videos.length === 0) return null

  const displayedVideos = videos.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 my-4">
      {/* Navigation discrète si plus de 3 vidéos */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors rounded-none disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            aria-label="Vidéos précédentes"
            title="Vidéos précédentes"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors rounded-none disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            aria-label="Vidéos suivantes"
            title="Vidéos suivantes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grille de 3 colonnes de vidéos avec animation d'entrée scroll reveal */}
      <div key={currentPage} className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {displayedVideos.map((video, index) => (
          <VideoCard key={video.id || index} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}

/* ============================================
   Article Card (Style Journalisme Contemporain avec Scroll Reveal)
   ============================================ */
function ArticleCard({ article, index = 0 }) {
  if (!article) return null
  const [ref, isVisible] = useScrollReveal()

  const image = getImage(article)
  const title = getTitle(article)
  const category = getCategoryLabel(article) || 'Actualités'
  const rawExcerpt = article?.contenu || article?.description || article?.extrait || ''
  const excerpt = rawExcerpt ? stripHtml(rawExcerpt).substring(0, 110) + '...' : ''
  const dateStr = article?.date_publication
    ? new Date(article.date_publication).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${((index ?? 0) % 4) * 85}ms` }}
      className={`reveal-init ${isVisible ? 'reveal-visible' : ''} h-full flex flex-col`}
    >
      <Link
        key={article?.id || index}
        to={article?.slug ? `/article/${article.slug}` : '/actualites'}
        className="group bg-white overflow-hidden shadow-sm border border-gray-200 hover:border-sept-blue hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out flex flex-col justify-between rounded-none relative h-full flex-1"
      >
        {/* Liseré supérieur bleu qui s'étend à 100% au survol */}
        <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full bg-sept-blue transition-all duration-500 ease-out z-20 pointer-events-none" />

        {/* Effet de reflet lumineux doux au survol */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none z-10" />

        {/* Bloc Image avec badge catégorie (format moyen) */}
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-gray-400">
              <FileText className="w-7 h-7 text-gray-300 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Septentrional</span>
            </div>
          )}

          {/* Badge Catégorie posé sur l'image */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-block bg-sept-ink/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 tracking-wider border border-white/10 rounded-none group-hover:bg-sept-blue group-hover:scale-105 transition-all duration-300">
              {category}
            </span>
          </div>

          {/* Voile sombre subtil pour contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Corps textuel (format moyen) */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
          <div>
            {/* Métadonnées : Date & tag */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400 font-semibold mb-1.5">
              {dateStr && <span>{dateStr}</span>}
              {dateStr && <span>•</span>}
              <span className="text-sept-blue font-bold">Septentrional</span>
            </div>

            {/* Titre */}
            <h3 className="text-sm sm:text-[15px] font-serif font-bold text-gray-900 group-hover:text-sept-blue transition-colors duration-200 line-clamp-2 leading-snug tracking-tight">
              {title}
            </h3>

            {/* Extrait */}
            {excerpt && (
              <p className="text-xs text-gray-600 line-clamp-2 mt-1.5 leading-normal">
                {excerpt}
              </p>
            )}
          </div>

          {/* Pied de carte avec lien d'action */}
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



/* ============================================
   Main Home Component
   ============================================ */
export default function Home() {
  const { social } = useSiteSettings()
  const [articles, setArticles] = useState([])
  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])
  const [flashInfos, setFlashInfos] = useState([])
  const [presidenceArticles, setPresidenceArticles] = useState([])
  const [justiceArticles, setJusticeArticles] = useState([])
  const [presidenceSlug, setPresidenceSlug] = useState('presidence-du-conseil')
  const [justiceSlug, setJusticeSlug] = useState('justice')
  const [loadingSpecialArticles, setLoadingSpecialArticles] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    // Toutes les requêtes partent immédiatement, mais seul le contenu principal
    // bloque le premier rendu. Les sections secondaires s'affichent ensuite au
    // fil de leur arrivée au lieu de retenir toute la page.
    const articleRequest = publicApi.getArticles({ per_page: 24, sort: '-date_publication' })
    const secondaryCompletion = Promise.allSettled([
      publicApi.getVideos({ per_page: 12 })
        .then(response => setVideos(getList(response))),
      publicApi.getCategories()
        .then(response => {
          const cats = sortCategories(getList(response))
          setCategories(cats)
          return cats
        }),
      publicApi.getFlashInfos()
        .then(response => setFlashInfos(getList(response))),
    ])

    let loadedArticles = []
    try {
      const response = await articleRequest
      loadedArticles = getList(response)
      const heroArticle = loadedArticles
        .slice(0, 10)
        .sort(
          (a, b) => Number(b.est_alerte === true || b.est_alerte === 1 || b.est_alerte === '1')
            - Number(a.est_alerte === true || a.est_alerte === 1 || a.est_alerte === '1')
        )[0]
      const heroImage = heroArticle ? getImage(heroArticle) : null

      // L'URL n'est connue qu'après l'API : ne précharger que l'image qui sera
      // réellement le premier slide, avant le rendu React du carrousel.
      if (heroImage) {
        preload(heroImage, { as: 'image', fetchPriority: 'high' })
      }

      setArticles(loadedArticles)
    } catch (error) {
      console.error("Erreur de chargement des articles d'accueil :", error)
    } finally {
      setLoading(false)
    }

    // Chargement ciblé des articles pour Présidence du Conseil & Justice
    secondaryCompletion.then((results) => {
      const catResult = results[1]
      const loadedCats = catResult?.status === 'fulfilled' ? catResult.value : []
      fetchSpecialCategoryArticles(loadedCats, loadedArticles)
    })

    await secondaryCompletion
  }

  async function fetchSpecialCategoryArticles(loadedCategories, generalArticles) {
    try {
      const matchCategory = (list, keywords) =>
        list.find((cat) => {
          const target = normalizeText(cat.slug || cat.nom || cat.name || '')
          return keywords.some((kw) => target.includes(normalizeText(kw)))
        })

      const foundPresidence = matchCategory(loadedCategories, [
        'presidence-du-conseil',
        'president-du-conseil',
        'presidence',
        'conseil-des-ministres',
        'conseil des ministres',
      ])
      const foundJustice = matchCategory(loadedCategories, [
        'justice',
        'judiciaire',
        'droit',
      ])

      const pSlug = foundPresidence?.slug || 'presidence-du-conseil'
      const jSlug = foundJustice?.slug || 'justice'
      setPresidenceSlug(pSlug)
      setJusticeSlug(jSlug)

      const [pRes, jRes] = await Promise.allSettled([
        publicApi.getArticles({ categorie: pSlug, per_page: 6, sort: '-date_publication' }),
        publicApi.getArticles({ categorie: jSlug, per_page: 6, sort: '-date_publication' }),
      ])

      const pApiList = pRes.status === 'fulfilled' ? getList(pRes.value) : []
      const jApiList = jRes.status === 'fulfilled' ? getList(jRes.value) : []

      const pMatched = generalArticles.filter(
        (a) =>
          articleMatchesCategory(a, 'presidence') ||
          articleMatchesCategory(a, 'president du conseil') ||
          articleMatchesCategory(a, 'conseil des ministres') ||
          normalizeText(getTitle(a)).includes('presidence') ||
          normalizeText(getTitle(a)).includes('conseil')
      )

      const jMatched = generalArticles.filter(
        (a) =>
          articleMatchesCategory(a, 'justice') ||
          articleMatchesCategory(a, 'judiciaire') ||
          articleMatchesCategory(a, 'tribunal') ||
          normalizeText(getTitle(a)).includes('justice') ||
          normalizeText(getTitle(a)).includes('judiciaire')
      )

      const dedupe = (items) => {
        const map = new Map()
        for (const item of items) {
          const key = item.id || item.slug || getTitle(item)
          if (key && !map.has(key)) map.set(key, item)
        }
        return Array.from(map.values())
      }

      setPresidenceArticles(dedupe([...pApiList, ...pMatched]))
      setJusticeArticles(dedupe([...jApiList, ...jMatched]))
    } catch (err) {
      console.error('Erreur chargement articles Présidence / Justice :', err)
    } finally {
      setLoadingSpecialArticles(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  // Les articles sont demandés du plus récent au plus ancien. Les 10 premiers
  // alimentent le carrousel et les 6 suivants la grille située juste en dessous.
  const latestArticles = useMemo(() => articles.slice(0, 16), [articles])

  // Parmi les dix articles récents du carrousel, les Breaking News passent en premier.
  const carouselArticles = useMemo(
    () => latestArticles
      .slice(0, 10)
      .sort(
        (a, b) => Number(b.est_alerte === true || b.est_alerte === 1 || b.est_alerte === '1')
          - Number(a.est_alerte === true || a.est_alerte === 1 || a.est_alerte === '1')
      ),
    [latestArticles]
  )

  const slides = useMemo(
    () =>
      carouselArticles.map((article, index) => ({
        id: article.id || `slide-${index}`,
        title: getTitle(article),
        slug: article.slug,
        image: getImage(article),
        category: getCategoryLabel(article),
        excerpt: stripHtml(article.extrait || article.meta_description || article.contenu || article.description || '').substring(0, 150) + '...',
        date: article.date_publication
          ? new Date(article.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
        isAlert: article.est_alerte === true || article.est_alerte === 1 || article.est_alerte === '1',
      })),
    [carouselArticles]
  )

  useEffect(() => {
    if (slides.length <= 1) return undefined

    const displayDuration = slides[currentSlide % slides.length]?.isAlert ? 9000 : 5000
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, displayDuration)

    return () => clearInterval(interval)
  }, [slides, currentSlide])

  const nextSlide = () => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const activeSlideIndex = slides.length ? currentSlide % slides.length : 0
  const activeSlide = slides[activeSlideIndex]
  const preloadNextSlide = () => {
    if (slides.length <= 1) return

    const nextImageUrl = slides[(activeSlideIndex + 1) % slides.length]?.image
    if (!nextImageUrl) return

    const nextImage = new Image()
    nextImage.decoding = 'async'
    nextImage.src = nextImageUrl
  }


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="skeleton h-64 md:h-96 w-full rounded-none" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-none" />)}
        </div>
      </div>
    )
  }

  const sameAs = [
    social.facebook,
    social.youtube,
    social.twitter,
    social.tiktok,
    social.whatsapp,
  ].filter(Boolean)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Septentrional',
    url: 'https://septentrional.tg',
    description: "Suivez les actualités du Togo, les informations des régions, la politique, la société et la culture avec Septentrional.",
    publisher: {
      '@type': 'Organization',
      name: 'Septentrional',
      url: 'https://septentrional.tg',
      sameAs,
    },
  }

  return (
    <div>
      <MetaTags 
        title="Accueil | Septentrional" 
        description="Suivez les actualités du Togo, les informations des régions, la politique, la société et la culture avec Septentrional."
        structuredData={structuredData}
      />
      <h1 className="sr-only">Septentrional : actualités et informations au Togo</h1>
      <FlashInfoBar flashInfos={flashInfos} />
      <TodayInfoSection />

      {/* ---- HERO: Carrousel + Présidence du Conseil & Justice ---- */}
      {slides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-6 pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Carrousel */}
            <div
              className="w-full lg:w-[68%] xl:w-[70%] relative group overflow-hidden shadow-xl border border-gray-200 aspect-[16/10] md:aspect-video lg:aspect-auto lg:h-[450px] bg-gray-100 animate-fade-in rounded-none"
            >
              <div className="relative w-full h-full" aria-live="polite">
                {activeSlide && (
                  <Link
                    key={activeSlide.id}
                    to={activeSlide.slug ? `/article/${activeSlide.slug}` : '/actualites'}
                    className="absolute inset-0 z-10 animate-fade-in block"
                  >
                    {activeSlide.image && (
                      <img
                        src={activeSlide.image}
                        className="relative z-[1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={activeSlide.title}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        onLoad={preloadNextSlide}
                        sizes="(min-width: 1024px) 75vw, 100vw"
                      />
                    )}
                    
                    {/* Overlay Dégradé pour la lisibilité */}
                    <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
                    {activeSlide.isAlert && (
                      <>
                        {/* Liseré rouge discret réservé aux Breaking News */}
                        <div
                          className="absolute inset-0 z-[3] pointer-events-none border-[3px] border-red-500/65"
                          style={{ boxShadow: 'inset 0 0 42px rgba(220, 38, 38, 0.72)' }}
                        />
                        {/* Ruban triangulaire exclusif */}
                        <div className="absolute left-0 top-0 z-[5] animate-breaking-ribbon">
                          <div className="h-0 w-0 border-r-[118px] border-t-[118px] border-r-transparent border-t-red-600 drop-shadow-md" />
                          <span className="absolute left-0 top-0 z-[6] flex h-[78px] w-[78px] items-center justify-center -rotate-45 text-[14px] font-black tracking-[0.04em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
                            BREAKING
                          </span>
                        </div>
                      </>
                    )}

                    {/* Contenu Texte */}
                    <div className="absolute bottom-0 left-0 right-0 z-[3] px-4 md:px-8 pb-10 md:pb-4 text-white">
                      <h2 className="text-base md:text-xl font-serif font-bold leading-tight mb-1 max-w-3xl drop-shadow-md">
                        {activeSlide.title}
                      </h2>
                      {activeSlide.excerpt && (
                        <p className="text-[11px] md:text-xs text-gray-200 mb-0 line-clamp-2 max-w-2xl hidden sm:block">
                          {activeSlide.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )}
              </div>
              
              {/* Flèches de Navigation */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevSlide(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex p-2.5 bg-black/40 hover:bg-black/70 backdrop-blur-md transition-colors text-white shadow-lg"
                    aria-label="Article précédent"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextSlide(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex p-2.5 bg-black/40 hover:bg-black/70 backdrop-blur-md transition-colors text-white shadow-lg"
                    aria-label="Article suivant"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Indicateurs en bas du carrousel */}
              <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center gap-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(index); }}
                    className={`h-1 transition-all duration-300 ${
                      index === activeSlideIndex
                        ? 'w-8 bg-sept-blue-strong shadow-sm'
                        : 'w-3 bg-white/70 hover:bg-white'
                    }`}
                    aria-label={`Afficher l'article ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Colonne Présidence du Conseil & Justice */}
            <PresidenceJusticeColumn
              presidenceArticles={presidenceArticles}
              justiceArticles={justiceArticles}
              presidenceSlug={presidenceSlug}
              justiceSlug={justiceSlug}
              loading={loadingSpecialArticles}
            />
          </div>
        </section>
      )}

      {/* ---- ARTICLES (Grille Actualités Récentes) ---- */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-sept-blue-strong" />
              <h2 className="font-serif font-bold text-lg sm:text-xl text-gray-900 tracking-tight">
                À la une & Actualités récentes
              </h2>
            </div>
            <Link
              to="/actualites"
              className="text-xs sm:text-sm font-black text-sept-blue-strong hover:text-sept-blue-dark flex items-center gap-1 group"
            >
              <span>Toutes les actualités</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {(articles.length > 10 ? articles.slice(10, 18) : articles.slice(0, 8)).map((article, index) => (
              <ArticleCard key={article.id || index} article={article} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ---- VIDÉOS & REPORTAGES YOUTUBE (Lecture directe sur place) ---- */}
      {videos.length > 0 && (
        <HomeVideosSection videos={videos} />
      )}

      {/* ---- CATÉGORIES ---- */}
      {categories.length > 0 && (
        <HomeCategoryNewsSection categories={categories} />
      )}

      {/* ---- REVIVEZ VOTRE MOIS DE : (6 derniers mois) ---- */}
      <HomeMonthlyArchivesSection />
    </div>
  )
}

/* ============================================
   Category News Section
   ============================================ */
function HomeCategoryNewsSection({ categories }) {
  const {
    categoryArticles,
    loadingCategory,
    selectedCategory,
    loadCategoryArticles,
  } = useCategory()

  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const scrollAmount = 250 // approximativement 2-3 catégories
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const defaultCategory = categories[0] ? getCategorySlug(categories[0]) : ''
  const activeCategory = selectedCategory || defaultCategory

  useEffect(() => {
    if (!selectedCategory && defaultCategory) {
      loadCategoryArticles(defaultCategory, 8)
    }
  }, [defaultCategory, selectedCategory, loadCategoryArticles])

  const handleSelectCategory = (slug) => {
    if (!slug || slug === activeCategory) return
    loadCategoryArticles(slug, 8)
  }

  return (
    <section id="accueil-categorie" className="max-w-7xl mx-auto px-4 pb-6 scroll-mt-4">
      <div className="flex items-center gap-1.5 mb-4">
        {/* Bouton gauche */}
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
          className="flex-1 flex overflow-x-auto scroll-smooth gap-1.5 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {categories.map((category) => {
            const slug = getCategorySlug(category)
            const isSelected = slug === activeCategory

            return (
              <button
                key={category.id || slug}
                type="button"
                onClick={() => handleSelectCategory(slug)}
                className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-none transition-all duration-200 flex-shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-sept-blue text-white border-sept-blue font-extrabold shadow-xs'
                    : 'bg-white text-gray-700 hover:text-sept-blue hover:bg-gray-50 border-gray-200'
                }`}
              >
                {(category.nom || category.name || '')}
              </button>
            )
          })}
        </div>

        {/* Bouton droit */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="flex-shrink-0 w-8 h-8 rounded-none flex items-center justify-center bg-sept-blue hover:bg-sept-blue-dark text-white shadow-xs transition-all duration-200 cursor-pointer"
          aria-label="Défiler à droite"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loadingCategory ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="space-y-3 bg-white p-4 border border-gray-100 rounded-none animate-pulse">
              <div className="skeleton aspect-video max-h-48 rounded-none" />
              <div className="skeleton h-3.5 w-1/3 rounded-none" />
              <div className="skeleton h-5 w-3/4 rounded-none" />
              <div className="skeleton h-3.5 w-full rounded-none" />
            </div>
          ))}
        </div>
      ) : categoryArticles && categoryArticles.length > 0 ? (
        <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {categoryArticles.slice(0, 8).map((article, i) => (
            <ArticleCard key={article.id || article.slug || i} article={article} index={i} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-none border border-gray-100 p-8 text-center text-sm text-gray-400">
          Aucun article trouvé pour cette catégorie
        </div>
      )}
    </section>
  )
}

/* ============================================
   Section Archives : Revivez votre mois de : (6 derniers mois)
   ============================================ */
function MonthCard({ month: m, index = 0 }) {
  const [ref, isVisible] = useScrollReveal()
  const targetUrl = `/actualites?annee=${m.annee}&mois=${m.mois}`
  const articleCount = m.total_articles

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index % 6) * 65}ms` }}
      className={`reveal-init ${isVisible ? 'reveal-visible' : ''} h-full flex flex-col`}
    >
      <Link
        key={m.periode || `${m.annee}-${m.mois}` || index}
        to={targetUrl}
        className="group relative flex flex-col bg-white border border-gray-200 hover:border-sept-blue rounded-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out overflow-hidden h-full flex-1"
        title={`Voir tous les articles de ${m.mois_nom} ${m.annee}`}
      >
        {/* Liseré supérieur bleu qui s'étend au survol */}
        <div className="h-1 w-0 group-hover:w-full bg-sept-blue transition-all duration-500 ease-out z-20 pointer-events-none" />

        {/* Visuel de couverture compact */}
        <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
          {m.image ? (
            <img
              src={resolveImageUrl(m.image)}
              alt={`${m.mois_nom} ${m.annee}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-none"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full bg-sept-blue flex flex-col items-center justify-center text-white p-1.5 text-center">
              <Calendar className="w-5 h-5 text-white/50 mb-0.5" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white/90">
                Édition
              </span>
            </div>
          )}

          {/* Badge nombre d'articles */}
          {articleCount !== null && articleCount !== undefined && articleCount > 0 && (
            <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-1 py-0.5 rounded-none tabular-nums">
              {articleCount} art.
            </span>
          )}
        </div>

        {/* Corps de la carte compact */}
        <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-sept-blue block leading-none">
              Mois de
            </span>
            <h3 className="text-xs sm:text-sm font-serif font-bold text-gray-900 group-hover:text-sept-blue transition-colors leading-tight mt-1 truncate">
              {m.mois_nom}
            </h3>
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
              {m.annee}
            </span>
          </div>

          {/* Lien d'action */}
          <div className="pt-1.5 mt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-semibold text-sept-blue group-hover:text-sept-blue-dark transition-colors">
            <span>Revivre</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  )
}

function HomeMonthlyArchivesSection() {
  const [months, setMonths] = useState([])

  useEffect(() => {
    let isMounted = true

    const loadArchives = async () => {
      try {
        const res = await publicApi.getArchivesMois()
        const data = res.data?.data || []
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Tri chronologique : du plus ancien au plus récent
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.annee, (a.mois || 1) - 1).getTime()
            const dateB = new Date(b.annee, (b.mois || 1) - 1).getTime()
            return dateA - dateB
          })
          setMonths(sorted)
          return
        }
      } catch {
        // Fallback si indisponible
      }

      // Génération automatique des 6 derniers mois par ordre chronologique (du plus ancien au plus récent)
      if (isMounted) {
        const monthsFr = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]
        const now = new Date()
        const fallbackList = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const annee = d.getFullYear()
          const mois = d.getMonth() + 1
          const nom = monthsFr[d.getMonth()]
          fallbackList.push({
            annee,
            mois,
            mois_nom: nom,
            label: `${nom} ${annee}`,
            periode: `${annee}-${String(mois).padStart(2, '0')}`,
            total_articles: null,
            image: null,
          })
        }
        setMonths(fallbackList)
      }
    }

    loadArchives()

    return () => {
      isMounted = false
    }
  }, [])

  if (!months || months.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 pt-2 pb-8">
      {/* En-tête de section */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-sept-blue shrink-0" />
          <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 tracking-tight">
            Revivez votre mois de :
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Les 6 derniers mois d'actualités
        </span>
      </div>

      {/* Grille compacte des 6 mois avec animation en cascade scroll reveal */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3">
        {months.map((m, index) => (
          <MonthCard key={m.periode || `${m.annee}-${m.mois}` || index} month={m} index={index} />
        ))}
      </div>
    </section>
  )
}


