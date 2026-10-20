import { useEffect, useState, useRef } from 'react'
import { publicApi } from '@services/api/public'
import { resolveImageUrl } from '@features/public/utils/articles'
import { Calendar, Droplets } from 'lucide-react'

const TODAY_LABEL = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function TodayInfoSection() {
  const [meteo, setMeteo] = useState(null)
  const [loadingMeteo, setLoadingMeteo] = useState(true)
  const [currentMeteoIndex, setCurrentMeteoIndex] = useState(0)
  const [occasions, setOccasions] = useState([])
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false)
  const scrollContainerRef = useRef(null)

  // Gestion du défilement automatique sur mobile pour Occasions
  useEffect(() => {
    if (occasions.length <= 1) return

    let intervalId
    if (!isAutoScrollPaused) {
      intervalId = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
          
          if (scrollWidth <= clientWidth) return

          const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10
          if (isAtEnd) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
          } else {
            scrollContainerRef.current.scrollBy({ left: clientWidth * 0.8, behavior: 'smooth' })
          }
        }
      }, 3500)
    }

    return () => clearInterval(intervalId)
  }, [occasions.length, isAutoScrollPaused])

  // Gestion du défilement météo (1 par 1 toutes les 2.5s)
  useEffect(() => {
    if (!meteo || !Array.isArray(meteo) || meteo.length <= 1) return

    const intervalId = setInterval(() => {
      setCurrentMeteoIndex((prev) => (prev + 1) % meteo.length)
    }, 2500)

    return () => clearInterval(intervalId)
  }, [meteo])

  useEffect(() => {
    let isMounted = true

    publicApi.getMeteoJour()
      .then((res) => {
        if (isMounted) {
          const meteoData = res.data?.data || null
          // Toujours commencer par Kara
          if (Array.isArray(meteoData)) {
            meteoData.sort((a, b) => {
              const aIsKara = (a.ville || '').toLowerCase().includes('kara') ? -1 : 0
              const bIsKara = (b.ville || '').toLowerCase().includes('kara') ? -1 : 0
              return aIsKara - bIsKara
            })
          }
          setMeteo(meteoData)
          setLoadingMeteo(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setMeteo(null)
          setLoadingMeteo(false)
        }
      })

    publicApi.getOccasionActive()
      .then((res) => {
        const data = res.data?.data || []
        if (isMounted) setOccasions(Array.isArray(data) ? data : [data].filter(Boolean))
      })
      .catch(() => {
        if (isMounted) setOccasions([])
      })

    return () => {
      isMounted = false
    }
  }, [])

  const currentMeteoData = Array.isArray(meteo) ? meteo[currentMeteoIndex] : meteo

  return (
    <section className="max-w-7xl mx-auto px-4 pt-3 space-y-3">
      {/* Date du jour + mention HAAC + météo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-center lg:gap-8 gap-3 bg-white rounded-none shadow-sm border border-gray-100 px-5 py-3 text-sm overflow-hidden min-h-[90px] md:min-h-[72px] h-auto">
        {/* Date & Mention légale HAAC */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sept-blue-dark shrink-0">
          <div className="flex items-center gap-2 font-serif font-bold text-base md:text-lg">
            <Calendar className="w-5 h-5 text-sept-blue" />
            <span className="capitalize tracking-wide">{TODAY_LABEL}</span>
          </div>

          <span className="hidden sm:inline-block w-px h-5 bg-gray-300" aria-hidden="true" />

          {/* Mention HAAC */}
          <div className="flex items-center text-sm md:text-base font-serif">
            <span className="text-sept-blue font-bold mr-1.5">Numéro</span>
            <span className="text-black font-extrabold tracking-tight">0053/HAAC/07-2022/pl/P</span>
          </div>
        </div>

        {/* Météo Loading / Shimmer */}
        {loadingMeteo ? (
          <div className="flex gap-4 overflow-hidden lg:justify-center">
            <div className="flex items-center justify-center gap-x-3 gap-y-2 bg-gray-50/50 rounded-none px-4 py-2 shrink-0 animate-pulse">
              <div className="w-10 h-10 rounded-none bg-gray-200/80"></div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-12 bg-gray-200/80 rounded-none"></div>
                <div className="h-3 w-16 bg-gray-200/80 rounded-none"></div>
              </div>
              <div className="w-px h-8 bg-gray-200 mx-1"></div>
              <div className="h-4 w-14 bg-gray-200/80 rounded-none"></div>
            </div>
          </div>
        ) : currentMeteoData ? (
          <div className="flex lg:justify-center items-center overflow-hidden">
            <div 
              key={currentMeteoIndex} 
              className="flex items-center justify-center gap-x-3 gap-y-2 text-gray-700 bg-sky-50 border border-sky-100 rounded-none px-4 py-2 shrink-0 animate-slide-up mx-auto"
            >
              <div className="flex items-center gap-2">
                {currentMeteoData.icone && (
                  <img
                    src={`https://openweathermap.org/img/wn/${currentMeteoData.icone}.png`}
                    alt={currentMeteoData.description || 'Météo'}
                    className="w-10 h-10 drop-shadow-sm"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-gray-900 text-xl">
                    {currentMeteoData.temperature !== null && currentMeteoData.temperature !== undefined ? `${currentMeteoData.temperature}°C` : ''}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 capitalize">{currentMeteoData.description}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 mx-1"></div>

              <div className="flex items-center gap-3 text-sm">
                {currentMeteoData.ville && (
                  <span className="font-bold text-gray-800 text-sm">{currentMeteoData.ville}</span>
                )}
              </div>
            </div>
          </div>
        ) : null}

      </div>

      {/* Occasions spéciales actives */}
      {occasions.length > 0 && (
        <div 
          ref={scrollContainerRef}
          onMouseEnter={() => setIsAutoScrollPaused(true)}
          onMouseLeave={() => setIsAutoScrollPaused(false)}
          onTouchStart={() => setIsAutoScrollPaused(true)}
          onTouchEnd={() => setIsAutoScrollPaused(false)}
          className={`flex gap-4 overflow-x-auto snap-x snap-mandatory md:flex-wrap md:justify-center md:overflow-visible pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${occasions.length === 1 ? 'justify-center' : ''}`}
        >
          {occasions.map((occasion, idx) => (
            <div
              key={occasion.id}
              className={`flex items-center gap-3 bg-white rounded-none shadow-sm hover:shadow-md border border-gray-100 hover:border-sept-blue transition-all duration-300 overflow-hidden shrink-0 snap-center md:flex-1 md:min-w-[280px] md:max-w-md animate-card-entrance ${occasions.length === 1 ? 'w-full max-w-md mx-auto' : 'w-[85vw] max-w-[320px]'}`}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              {occasion.image && (
                <img
                  src={resolveImageUrl(occasion.image)}
                  alt={occasion.titre}
                  className="w-24 h-24 object-cover flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="py-2 pr-3 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{occasion.titre}</p>
                {occasion.texte && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{occasion.texte}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
