import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Upload, Image, Check, Loader2 } from 'lucide-react'
import { adminApi } from '@services/api/admin'
import { resolveImageUrl } from '@features/public/utils/articles'
import toast from 'react-hot-toast'

/**
 * MediaPickerModal — Modal overlay pour choisir une image depuis la médiathèque.
 *
 * Props:
 *   isOpen     — boolean : afficher ou cacher le modal
 *   onClose    — () => void : fermer le modal
 *   onSelect   — (media: { id, url, title, alt_text, ... }) => void : callback quand une image est choisie
 *   type       — 'image' | 'video' | '' : filtrer par type (défaut: 'image')
 */
export default function MediaPickerModal({ isOpen, onClose, onSelect, type = 'image' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const fileInputRef = useRef(null)
  const searchTimeout = useRef(null)

  const loadMedia = useCallback(async (pageNum = 1, searchQuery = '', append = false) => {
    setLoading(true)
    try {
      const params = { page: pageNum, per_page: 24 }
      if (type) params.type = type
      if (searchQuery) params.q = searchQuery

      const res = await adminApi.getMediaLibrary(params)
      const data = res.data?.data || res.data || []
      const lastPage = res.data?.last_page || 1

      if (append) {
        setItems(prev => [...prev, ...data])
      } else {
        setItems(data)
      }
      setHasMore(pageNum < lastPage)
    } catch (err) {
      console.error('Erreur chargement médiathèque:', err)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    if (isOpen) {
      setSelectedId(null)
      setSearch('')
      setPage(1)
      loadMedia(1, '')
    }
  }, [isOpen, loadMedia])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const handleSearch = (value) => {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      loadMedia(1, value)
    }, 350)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadMedia(nextPage, search, true)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const mediaType = file.type.startsWith('image') ? 'image' : 'video'
      await adminApi.uploadMedia({ type: mediaType, file })
      // Reload the list to include the new upload
      setPage(1)
      await loadMedia(1, search)
    } catch (err) {
      console.error('Erreur upload:', err)
      toast.error("Erreur lors de l’upload du fichier")
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleConfirm = () => {
    const selected = items.find(m => m.id === selectedId)
    if (selected) {
      onSelect(selected)
      onClose()
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="media-picker-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Sélectionner un média"
    >
      <div className="media-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="media-picker-header">
          <div>
            <h2 className="media-picker-title">
              <Image className="w-5 h-5" />
              Médiathèque
            </h2>
            <p className="media-picker-subtitle">
              Choisissez une image existante ou importez-en une nouvelle
            </p>
          </div>
          <button onClick={onClose} className="media-picker-close" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="media-picker-toolbar">
          <div className="media-picker-search">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un média..."
              className="media-picker-search-input"
            />
          </div>
          <label className="media-picker-upload-btn">
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</>
            ) : (
              <><Upload className="w-4 h-4" /> Importer</>
            )}
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Grid */}
        <div className="media-picker-grid-container">
          {loading && items.length === 0 ? (
            <div className="media-picker-empty">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p>Chargement…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="media-picker-empty">
              <Image className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500">Aucun média trouvé</p>
              <p className="text-gray-400 text-sm">Importez votre premier fichier</p>
            </div>
          ) : (
            <>
              <div className="media-picker-grid">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`media-picker-item ${selectedId === m.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(m.id)}
                    onDoubleClick={() => { setSelectedId(m.id); onSelect(m); onClose() }}
                    title={m.title || m.original_name || 'Média'}
                  >
                    <div className="media-picker-item-image">
                      {m.type === 'image' ? (
                        <img
                          src={resolveImageUrl(m.url)}
                          alt={m.alt_text || m.title || ''}
                          loading="lazy"
                        />
                      ) : (
                        <div className="media-picker-item-video-placeholder">
                          <span>🎬</span>
                        </div>
                      )}
                    </div>
                    {selectedId === m.id && (
                      <div className="media-picker-item-check">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <span className="media-picker-item-name">
                      {m.title || m.original_name || 'Média'}
                    </span>
                  </button>
                ))}
              </div>
              {hasMore && (
                <div className="media-picker-load-more">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="media-picker-load-more-btn"
                  >
                    {loading ? 'Chargement…' : 'Charger plus'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="media-picker-footer">
          <button type="button" onClick={onClose} className="media-picker-cancel-btn">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId}
            className="media-picker-confirm-btn"
          >
            <Check className="w-4 h-4" />
            Sélectionner
          </button>
        </div>
      </div>
    </div>
  , document.body)
}
