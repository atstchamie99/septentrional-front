import { useState } from 'react'
import { Share2 } from 'lucide-react'
import ShareModal from './ShareModal'

/**
 * @param {{
 *   url: string,
 *   title: string,
 *   description?: string,
 *   imageUrl?: string,
 *   className?: string,
 *   isVideo?: boolean,
 *   size?: number,
 * }} props
 */
export default function ShareIcon({
  url,
  title,
  description,
  imageUrl,
  className = '',
  isVideo = false,
  size = 20
}) {
  const [isOpen, setIsOpen] = useState(false)

  const shareData = {
    title,
    text: description,
    url,
    image: imageUrl
  }

  const handleNativeShare = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erreur de partage:', err)
          // Fallback vers la modale si le partage natif échoue
          setIsOpen(true)
        }
      }
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleNativeShare}
        onPointerDown={(e) => e.stopPropagation()}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Partager"
      >
        <Share2 size={size} className="text-gray-600 hover:text-sept-blue-strong" />
      </button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shareData={shareData}
        isVideo={isVideo}
      />
    </>
  )
}
