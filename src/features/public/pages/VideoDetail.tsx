import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import NotFound from '@features/public/pages/NotFound'
import { Calendar, User, ArrowLeft, Video } from 'lucide-react'
import { ShareIcon } from '@shared/components/ShareButton'
import MetaTags from '@shared/components/MetaTags'
import Breadcrumbs from '@shared/components/Breadcrumbs'
import { sanitizeHtml } from '@shared/utils/sanitize'
import { resolveImageUrl, stripHtml } from '@features/public/utils/articles'

interface Video {
  id: number
  titre: string
  slug: string
  description?: string
  image?: string
  miniature?: string
  miniature_url?: string
  date_publication?: string
  created_at?: string
  updated_at?: string
  nombre_vues?: number
  auteur?: { name?: string }
  categorie?: { nom?: string }
  type_video?: string
  url_video?: string
  file_url?: string
  video_url?: string
  fichier_url?: string
  video_path?: string
  embed_url?: string
}

export default function VideoDetail() {
  const { slug } = useParams<{ slug?: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideo()
  }, [slug])

  const loadVideo = async () => {
    try {
      const res = await publicApi.getVideo(slug)
      setVideo(res.data.data || res.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-20">Chargement...</div>
  if (!video) return <NotFound />

  const shareUrl = `https://septentrional.tg/video/${slug}`
  const imageUrl = resolveImageUrl(
    video.image || video.miniature || video.miniature_url
  ) || undefined
  const description = stripHtml(video.description)
    || `Regardez la vidéo "${video.titre}" sur Septentrional`

  const getEmbedUrl = (video: Video) => {
    if (video.type_video === 'upload') return null
    if (video.embed_url) return video.embed_url
    if (video.type_video === 'youtube' && video.url_video) {
      const match = video.url_video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      if (match) return `https://www.youtube.com/embed/${match[1]}`
    }
    if (video.type_video === 'vimeo' && video.url_video) {
      const match = video.url_video.match(/vimeo\.com\/(\d+)/)
      if (match) return `https://player.vimeo.com/video/${match[1]}`
    }
    return null
  }

  // Pour les vidéos uploadées, le backend peut stocker l'URL dans différents champs
  const getVideoSourceUrl = (video: Video) => {
    return video.url_video || video.file_url || video.video_url || video.fichier_url || video.video_path || null
  }

  const embedUrl = getEmbedUrl(video)
  const videoSourceUrl = getVideoSourceUrl(video)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <MetaTags
        title={video.titre}
        description={description}
        image={imageUrl}
        url={shareUrl}
        type="video.other"
        imageAlt={video.titre}
        publishedTime={video.date_publication || video.created_at}
        modifiedTime={video.updated_at}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.titre,
          description,
          thumbnailUrl: imageUrl ? [imageUrl] : undefined,
          uploadDate: video.date_publication,
          contentUrl: video.url_video,
          embedUrl: video.embed_url,
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'Accueil', path: '/' },
          { label: 'Vidéos', path: '/videos' },
          { label: video.titre },
        ]}
      />
      <Link to="/videos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sept-blue-strong mb-4 transition">
        <ArrowLeft className="w-4 h-4" />
        Retour aux vidéos
      </Link>

      <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-sm">
        {/* Lecteur vidéo */}
        <div className="relative">
          {embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={video.titre}
              ></iframe>
            </div>
          ) : videoSourceUrl ? (
            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                controls 
                className="w-full h-full"
                src={videoSourceUrl}
                poster={imageUrl}
                preload="metadata"
                playsInline
                onError={(e) => console.error('Video load error:', e)}
              >
                Votre navigateur ne supporte pas la vidéo
              </video>
            </div>
          ) : (
            <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-400">
              <Video className="w-16 h-16" />
            </div>
          )}
          
          {/* Icône Partager en superposition */}
          <div className="absolute top-4 right-4">
            <ShareIcon
              url={shareUrl}
              title={video.titre}
              description={description}
              imageUrl={imageUrl}
              size={24}
              className="bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Infos */}
        <div className="p-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-4">{video.titre}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {video.auteur && (
              <span className="flex items-center gap-1 font-medium">
                <User className="w-4 h-4" />
                {video.auteur.name}
              </span>
            )}
            {video.date_publication && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-4 h-4" />
                {new Date(video.date_publication).toLocaleDateString('fr-FR')}
              </span>
            )}
            {video.categorie && (
              <span className="bg-sept-blue-strong text-white px-3 py-1 rounded-none text-xs font-semibold">
                {video.categorie.nom}
              </span>
            )}
          </div>

          {video.description && (
            <div 
              className="prose max-w-none text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(video.description) }}
            />
          )}
        </div>
      </div>
    </div>
)}
