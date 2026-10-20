import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

const getFlashText = (flashInfo) =>
  flashInfo?.texte || flashInfo?.text || flashInfo?.titre || flashInfo?.title || ''

const getFlashArticleSlug = (flashInfo) =>
  flashInfo?.article?.slug || null

export default function FlashInfoBar({ flashInfos }) {
  if (!flashInfos || !flashInfos.length) return null

  const items = flashInfos
    .map((fi) => ({ text: getFlashText(fi), slug: getFlashArticleSlug(fi) }))
    .filter((item) => item.text)

  if (!items.length) return null

  // Pour un défilement infini continu et sans saut, on répète la liste
  const displayItems =
    items.length < 4
      ? [...items, ...items, ...items, ...items]
      : [...items, ...items]

  return (
    <section className="w-full relative z-20" aria-label="Flash info">
      {/* Conteneur principal avec hauteur stricte pour garantir l'alignement parfait */}
      <div className="flex w-full h-8 sm:h-9 bg-white border-b border-gray-200 shadow-xs font-sans">
        
        {/* Espaceur pour décaler le badge vers la droite */}
        <div className="w-4 sm:w-8 md:w-12 lg:w-16 shrink-0 h-full bg-white" />

        {/* Badge bleu : FLASH INFO */}
        <div className="flex shrink-0 items-center justify-center gap-1.5 bg-sept-blue h-full px-4 sm:px-6 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white">
          <Zap className="w-3.5 h-3.5 text-white fill-white shrink-0 animate-pulse" />
          <span className="whitespace-nowrap mt-0.5">Flash info</span>
        </div>

        {/* Texte défilant sur fond blanc */}
        <div className="flex-1 flex items-center overflow-hidden h-full">
          <div className="flex whitespace-nowrap animate-marquee-slow hover:[animation-play-state:paused] items-center gap-6 sm:gap-10 pl-4 sm:pl-6 motion-reduce:animate-none">
            {displayItems.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 animate-pulse" />
                {item.slug ? (
                  <Link
                    to={`/article/${item.slug}`}
                    className="text-[11px] sm:text-xs font-bold text-sept-blue-dark transition-colors hover:text-black hover:underline"
                  >
                    {item.text}
                  </Link>
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold text-sept-blue-dark">
                    {item.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

