import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { Video, Play, Calendar } from 'lucide-react'
import { ShareIcon } from '@shared/components/ShareButton'
import MetaTags from '@shared/components/MetaTags'

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      const res = await publicApi.getVideos({ per_page: 12 })
      setVideos(res.data.data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="skeleton h-8 w-48 rounded-lg mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-video rounded-xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <MetaTags
        title="Vidéos"
        description="Regardez les reportages, émissions et vidéos de Septentrional."
        url="/videos"
      />
      <h1 className="section-title mb-6">
        <Video className="w-6 h-6 text-sept-blue-strong shrink-0" />
        Vidéos
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, i) => {
          const rawDesc = video?.description || video?.extrait || video?.contenu || ''
          const description = typeof rawDesc === 'string' ? rawDesc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim() : ''

          return (
            <Link 
              key={video.id} 
              to={`/video/${video.slug}`} 
              className="group animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative rounded-none overflow-hidden aspect-video bg-black shadow-md">
                {video.miniature ? (
                  <img
                    src={video.miniature}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-500 group-hover:scale-105"
                    alt={video.titre}
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-sept-blue-dark">
                    <Video className="h-14 w-14 text-white/30" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-none flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
                {video.duree && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-none">
                    {Math.floor(video.duree / 60)}:{(video.duree % 60).toString().padStart(2, '0')}
                  </div>
                )}
                {/* Icône Partager */}
                <div className="absolute top-2 right-2">
                  <ShareIcon
                    url={`${window.location.origin}/video/${video.slug}`}
                    title={video.titre}
                    description={description || `Regardez "${video.titre}" sur Septentrional`}
                    imageUrl={video.miniature}
                    size={16}
                    className="bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-sm font-serif font-bold text-gray-800 line-clamp-2 group-hover:text-sept-blue-strong transition-colors duration-200">
                  {video.titre}
                </h2>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{description}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2">
                {video.date_publication && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {new Date(video.date_publication).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </Link>
          )
        })}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucune vidéo disponible</div>
      )}
    </div>
  )
}
