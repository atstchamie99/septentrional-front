import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'

export default function HeroCarousel({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const activeIndex = slides.length ? currentSlide % slides.length : 0
  const activeSlide = slides[activeIndex]

  const nextSlide = useCallback(() => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Auto-play timer (5.5s)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return
    const timer = setInterval(nextSlide, 5500)
    return () => clearInterval(timer)
  }, [nextSlide, slides.length, isPaused])

  // Preload next image for instant transition
  useEffect(() => {
    if (slides.length <= 1) return
    const nextIdx = (activeIndex + 1) % slides.length
    if (slides[nextIdx]?.image) {
      const img = new Image()
      img.src = slides[nextIdx].image
    }
  }, [activeIndex, slides])

  // Swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX
  }
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX
  }
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    if (distance > 50) nextSlide()
    if (distance < -50) prevSlide()
    touchStartX.current = 0
    touchEndX.current = 0
  }

  if (!slides || slides.length === 0) return null

  return (
    <div
      className="w-full relative h-[320px] sm:h-[420px] lg:h-[480px] xl:h-[520px] overflow-hidden rounded-2xl bg-gray-900 shadow-2xl group border border-gray-800/80 transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Ambient Blurred Backdrop for seamless aspect ratio fill */}
      {activeSlide?.image && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40 brightness-75 transition-all duration-700 pointer-events-none"
          style={{ backgroundImage: `url(${activeSlide.image})` }}
        />
      )}

      {/* 2. Main Slide Image & Content with Smooth Cross-fade */}
      <div className="relative w-full h-full">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex
          return (
            <Link
              key={slide.id || idx}
              to={slide.slug ? `/article/${slide.slug}` : '/actualites'}
              className={`absolute inset-0 z-10 transition-all duration-700 ease-out flex flex-col justify-end ${
                isActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover object-[center_20%] sm:object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sept-blue-dark to-gray-900 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-white/20" />
                </div>
              )}

              {/* Multi-layered Vignette Overlay for crisp text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-[1]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30 z-[1]" />

              {/* Text & Badges Content Box */}
              <div className="relative z-[2] p-5 sm:p-7 md:p-8 max-w-4xl space-y-2.5">
                {/* Badges row */}
                <div className="flex items-center flex-wrap gap-2">
                  {slide.isAlert ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ALERTE INFO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sept-blue-strong/90 backdrop-blur-md text-white shadow-md">
                      <Sparkles className="w-3 h-3" />
                      À LA UNE
                    </span>
                  )}

                  {slide.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                      {slide.category}
                    </span>
                  )}

                  {slide.date && (
                    <span className="text-xs text-gray-300/90 font-medium ml-1">
                      {slide.date}
                    </span>
                  )}
                </div>

                {/* Article Headline */}
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-extrabold text-white leading-tight tracking-tight drop-shadow-md line-clamp-2 sm:line-clamp-3">
                  {slide.title}
                </h2>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 3. Controls: Next / Prev Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevSlide()
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-sept-blue-strong backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group-hover:opacity-100 opacity-80"
            aria-label="Article précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextSlide()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-sept-blue-strong backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group-hover:opacity-100 opacity-80"
            aria-label="Article suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 4. Interactive Slide Indicators & Progress Counter */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentSlide(idx)
              }}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === activeIndex
                  ? 'w-6 sm:w-8 bg-sept-blue-strong shadow-md shadow-sept-blue-strong/50'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Aller au slide ${idx + 1}`}
            />
          ))}
          <span className="text-[11px] font-bold text-white/80 ml-1.5 tabular-nums">
            {activeIndex + 1}/{slides.length}
          </span>
        </div>
      )}
    </div>
  )
}
