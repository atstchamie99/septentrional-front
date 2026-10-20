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
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function ShareButton({
  url,
  title,
  description,
  imageUrl,
  className = '',
  isVideo = false,
  children = null
}) {
  const [isOpen, setIsOpen] = useState(false)

  const shareData = {
    title,
    text: description,
    url,
    image: imageUrl
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        })
      } catch (err) {
        console.error('Erreur de partage:', err)
      }
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleNativeShare}
        className={`flex items-center gap-2 px-4 py-2 bg-sept-blue-strong text-white rounded-lg hover:bg-sept-blue-dark transition-colors ${className}`}
        aria-label="Partager"
      >
        <Share2 size={18} />
        {children || <span>Partager</span>}
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
