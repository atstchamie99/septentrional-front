import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Check, MessageCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

// Icône Facebook SVG personnalisée
const FacebookIcon = ({ size = 22, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
)

// Icône X/Twitter SVG personnalisée
const XTwitterIcon = ({ size = 22, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const socialLinks = {
  facebook: (url, title) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  twitter: (url, text) => 
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  whatsapp: (url, text) => 
    `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  email: (url, title, text) => 
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
}

const socialConfig = [
  { key: 'facebook', icon: FacebookIcon, label: 'Facebook', color: 'text-blue-600' },
  { key: 'twitter', icon: XTwitterIcon, label: 'X (Twitter)', color: 'text-gray-900' },
  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' }
]

export default function ShareModal({ isOpen, onClose, shareData, isVideo }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      toast.success('Lien copié dans le presse-papier!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Échec de la copie')
    }
  }

  const handleSocialShare = (key) => {
    const generator = socialLinks[key]
    if (generator) {
      const url = generator(
        shareData.url,
        shareData.title,
        shareData.text || '',
      )
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full animate-fade-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Partager</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Copier lien */}
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-gray-500" />
              )}
            </div>
            <span className="flex-1 font-medium text-gray-700">Copier le lien</span>
          </button>

          {/* Separateur */}
          <div className="border-t border-gray-100 my-2" />
          
          {/* Message */}
          <p className="text-sm text-gray-500 text-center px-4">
            Ou partagez sur vos réseaux sociaux
          </p>

          {/* Réseaux sociaux */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {socialConfig.map(({ key, icon: Icon, label, color }) => (
              <button
                key={key}
                onClick={() => handleSocialShare(key)}
                className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <Icon size={22} className={`transition-colors ${color} group-hover:scale-110`} />
                <span className="text-sm font-medium text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Embed (uniquement pour vidéos) */}
          {isVideo && (
            <>
              <div className="border-t border-gray-100 my-4" />
              <div className="mt-2">
                <h4 className="font-semibold text-gray-800 mb-2">Intégrer la vidéo</h4>
                <div className="relative">
                  <textarea
                    readOnly
                    value={`<iframe src="${shareData.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none"
                    rows={3}
                    onClick={(e) => {
                      e.target.select()
                      copyToClipboard()
                    }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-sept-blue-strong"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
