import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Image as ImageIcon,
  Video,
  Trash2,
  Upload,
  Link as LinkIcon,
  Search,
  Eye,
  X,
  Loader2,
  Plus,
  CheckSquare,
  Square
} from 'lucide-react'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { resolveImageUrl } from '@features/public/utils/articles'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function MediaLibrary() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [type, setType] = useState('')
  const [usage, setUsage] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const confirm = useConfirm()
  const fileInputRef = useRef(null)
  const searchTimeout = useRef(null)
  const mediaUrl = (media) => resolveImageUrl(media.url)

  const loadMedia = useCallback(async (pageNum = 1, filterType = type, searchQuery = search, filterUsage = usage) => {
    setLoading(true)
    try {
      const params = { page: pageNum, per_page: 24 }
      if (filterType) params.type = filterType
      if (searchQuery) params.q = searchQuery
      if (filterUsage) params.usage = filterUsage

      const res = await adminApi.getMediaLibrary(params)
      const data = res.data?.data || res.data || []
      setItems(data)
      setLastPage(res.data?.last_page || 1)
      setPage(pageNum)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Erreur chargement médiathèque:', error)
      toast.error('Erreur lors du chargement de la médiathèque')
    } finally {
      setLoading(false)
    }
  }, [type, search, usage])

  useEffect(() => {
    loadMedia(1, type, search)
  }, [type, usage])

  useEffect(() => {
    if (!items.some((media) => media.processing)) return undefined

    const timer = window.setTimeout(() => {
      loadMedia(page, type, search, usage)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [items, page, type, search, usage, loadMedia])

  useEffect(() => {
    if (!selectedMedia) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedMedia])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadMedia(1, type, val)
    }, 350)
  }

  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return
    setBusy(true)
    let count = 0
    for (const file of Array.from(files)) {
      try {
        const mediaType = file.type.startsWith('image') ? 'image' : 'video'
        await adminApi.uploadMedia({
          type: mediaType,
          file,
          title: file.name
        })
        count++
      } catch (err) {
        console.error('Erreur upload:', err)
        toast.error(`Échec upload: ${file.name}`)
      }
    }
    if (count > 0) {
      toast.success(`${count} fichier(s) importé(s) avec succès`)
      loadMedia(1, type, search)
    }
    setBusy(false)
  }

  const handleFileSelect = (e) => {
    handleUploadFiles(e.target.files)
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files)
    }
  }

  const addExternalLink = async () => {
    const url = window.prompt('Entrez l\'URL externe de la vidéo (YouTube, Vimeo, mp4...) :')
    if (!url) return
    setBusy(true)
    try {
      await adminApi.uploadMedia({
        type: 'video',
        external_url: url,
        title: url
      })
      toast.success('Lien vidéo ajouté')
      loadMedia(1, type, search)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout du lien')
    } finally {
      setBusy(false)
    }
  }

  const requestRemoveMedia = async (media, e) => {
    if (e) e.stopPropagation()
    if (!await confirm({ title: 'Supprimer ce média ?', message: `« ${media.title || media.original_name || 'Ce média'} » sera supprimé définitivement.`, confirmLabel: 'Supprimer' })) return
    removeMedia(media)
  }

  const removeMedia = async (media) => {
    try {
      await adminApi.deleteMedia(media.id)
      toast.success('Média supprimé')
      setItems(items.filter(x => x.id !== media.id))
      if (selectedMedia?.id === media.id) setSelectedMedia(null)
      setSelectedIds((prev) => {
        if (!prev.has(media.id)) return prev
        const next = new Set(prev)
        next.delete(media.id)
        return next
      })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const toggleSelect = (id, e) => {
    if (e) e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const requestBulkDelete = async () => {
    const count = selectedIds.size
    if (count === 0) return
    if (!await confirm({
      title: `Supprimer ${count} média${count > 1 ? 's' : ''} ?`,
      message: 'Les médias encore utilisés dans un contenu seront automatiquement ignorés.',
      confirmLabel: 'Supprimer',
    })) return

    setBulkDeleting(true)
    try {
      const res = await adminApi.bulkDeleteMedia(Array.from(selectedIds))
      const { deleted = [], skipped = [] } = res.data || {}
      if (deleted.length > 0) {
        setItems((prev) => prev.filter((x) => !deleted.includes(x.id)))
      }
      if (skipped.length > 0) {
        toast.error(`${deleted.length} supprimé(s), ${skipped.length} encore utilisé(s) et conservé(s).`)
        setSelectedIds(new Set(skipped.map((s) => s.id)))
      } else {
        toast.success(`${deleted.length} média(s) supprimé(s).`)
        setSelectedIds(new Set())
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression groupée')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Zone Drag and drop global overlay indicator */}
      {isDragging && (
        <div className="fixed inset-0 bg-sept-blue-strong/20 backdrop-blur-sm border-4 border-dashed border-sept-blue-strong z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-8 rounded-none shadow-2xl text-center space-y-3 border border-gray-300">
            <Upload className="w-16 h-16 mx-auto text-sept-blue-strong animate-bounce" />
            <h3 className="text-xl font-serif font-bold uppercase text-gray-800">Déposez vos fichiers ici</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Images (JPG, PNG, WebP) ou Vidéos (MP4, WebM)</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Ressources & Archives</span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-3">
            <ImageIcon className="w-7 h-7 text-sept-accent" />
            Médiathèque
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addExternalLink}
            disabled={busy}
            className="btn-secondary flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-none"
          >
            <LinkIcon className="w-4 h-4 text-sept-blue-strong" />
            Lien vidéo
          </button>

          <label className="btn-primary flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider shadow-sm rounded-none">
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importer des médias
              </>
            )}
            <input
              ref={fileInputRef}
              hidden
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/ogg"
              onChange={handleFileSelect}
              disabled={busy}
            />
          </label>
        </div>
      </div>

      {/* Toolbar : Filtres et Recherche */}
      <div className="bg-white p-4 rounded-none shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-none border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setType('')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
              type === ''
                ? 'bg-white text-sept-blue-strong shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setType('image')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 ${
              type === 'image'
                ? 'bg-white text-sept-blue-strong shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Images
          </button>
          <button
            onClick={() => setType('video')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 ${
              type === 'video'
                ? 'bg-white text-purple-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Vidéos
          </button>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-none border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setUsage('')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none ${usage === '' ? 'bg-white text-sept-blue-strong shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setUsage('used')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none ${usage === 'used' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Utilisés
          </button>
          <button
            onClick={() => setUsage('unused')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none ${usage === 'unused' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            À nettoyer
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher par titre..."
            className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:border-sept-blue-strong focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); loadMedia(1, type, '') }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden space-y-2 p-2">
              <div className="skeleton aspect-square rounded-none w-full" />
              <div className="skeleton h-3 w-3/4 rounded-none" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-none border border-gray-200 flex items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8 text-sept-accent" />
          </div>
          <h3 className="text-lg font-serif font-bold uppercase tracking-wide text-gray-800">Aucun média trouvé</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {search
              ? `Aucun résultat pour "${search}". Essayez une autre recherche.`
              : 'Glissez-déposez des fichiers n\'importe où sur cette page ou cliquez sur "Importer des médias".'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider rounded-none"
          >
            <Plus className="w-4 h-4" />
            Ajouter un fichier
          </button>
        </div>
      ) : (
        <>
          {isAdmin() && selectedIds.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-sept-blue-strong text-white rounded-none px-4 py-2.5 shadow-md border-y border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-none bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                >
                  Annuler
                </button>
                <button
                  onClick={requestBulkDelete}
                  disabled={bulkDeleting}
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-none bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {bulkDeleting ? 'Suppression…' : 'Supprimer la sélection'}
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMedia(m)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-none border bg-white shadow-sm transition-all hover:shadow-md ${
                  selectedIds.has(m.id) ? 'border-sept-blue-strong ring-2 ring-sept-blue-strong' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {isAdmin() && (
                  <button
                    onClick={(e) => toggleSelect(m.id, e)}
                    title={selectedIds.has(m.id) ? 'Désélectionner' : 'Sélectionner'}
                    className={`absolute top-2 left-2 z-10 rounded-none p-1 shadow transition-all ${
                      selectedIds.has(m.id)
                        ? 'bg-sept-blue-strong text-white'
                        : 'bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-white'
                    }`}
                  >
                    {selectedIds.has(m.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                )}
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center rounded-none">
                  {m.processing ? (
                    <div className="flex flex-col items-center justify-center text-sept-blue-strong space-y-2 p-3 text-center">
                      <Loader2 className="w-9 h-9 animate-spin" />
                      <span className="text-xs font-semibold">Optimisation…</span>
                    </div>
                  ) : m.type === 'image' ? (
                    <img
                      src={mediaUrl(m)}
                      alt={m.alt_text || m.title || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full relative bg-gray-950 rounded-none">
                      {m.source === 'external' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 space-y-1">
                          <Video className="w-10 h-10" />
                          <span className="text-[10px] font-bold uppercase bg-purple-900/80 px-2 py-0.5 rounded-none border border-purple-700">Lien vidéo</span>
                        </div>
                      ) : (
                        <video
                          src={mediaUrl(m)}
                          muted
                          preload="metadata"
                          className="w-full h-full object-cover rounded-none"
                        />
                      )}
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-black/80 text-white px-2 py-0.5 rounded-none border border-white/20">Vidéo</span>
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMedia(m) }}
                      title="Voir les détails"
                      className="rounded-none bg-white p-2 text-gray-800 shadow transition-all hover:bg-sept-blue-strong hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={(e) => requestRemoveMedia(m, e)}
                        title="Supprimer"
                        className="p-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-all shadow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-2.5 flex items-center justify-between gap-1 bg-white border-t border-gray-100">
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-gray-700 truncate" title={m.title || m.original_name}>
                      {m.title || m.original_name || 'Sans titre'}
                    </span>
                    <span className="block text-[10px] font-mono text-gray-400 truncate" title={m.folder}>{m.folder}</span>
                  </div>
                  {m.processing ? (
                    <Loader2 className="shrink-0 w-3.5 h-3.5 text-sept-blue-strong animate-spin" />
                  ) : (
                    <span className={`shrink-0 w-2.5 h-2.5 rounded-none ${m.is_used ? 'bg-emerald-500' : 'bg-amber-400'}`} title={m.is_used ? 'Utilisé' : 'Non utilisé'} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => loadMedia(page - 1)}
                className="px-4 py-2 border border-gray-300 rounded-none text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-gray-50 bg-white"
              >
                Précédent
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 font-mono">
                Page {page} / {lastPage}
              </span>
              <button
                disabled={page >= lastPage}
                onClick={() => loadMedia(page + 1)}
                className="px-4 py-2 border border-gray-300 rounded-none text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-gray-50 bg-white"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {selectedMedia && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="my-auto flex w-full max-w-3xl flex-col overflow-y-auto rounded-none border border-gray-300 bg-white shadow-2xl animate-fade-in max-h-[calc(100dvh-2rem)] md:flex-row md:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Display */}
            <div className="flex min-h-[260px] items-center justify-center bg-gray-950 p-4 md:w-3/5 md:min-h-0">
              {selectedMedia.processing ? (
                <div className="text-center text-white space-y-3">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-sept-blue-strong" />
                  <p>Optimisation de la vidéo en cours…</p>
                </div>
              ) : selectedMedia.type === 'image' ? (
                <img
                  src={mediaUrl(selectedMedia)}
                  alt={selectedMedia.alt_text || selectedMedia.title || ''}
                  className="max-h-[55dvh] max-w-full rounded-none object-contain md:max-h-[calc(100dvh-2rem)]"
                />
              ) : selectedMedia.source === 'external' ? (
                <div className="text-center p-6 text-white space-y-3">
                  <Video className="w-16 h-16 mx-auto text-purple-400" />
                  <p className="text-sm font-mono break-all">{selectedMedia.external_url}</p>
                  <a
                    href={selectedMedia.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-4 py-2 bg-purple-600 text-white text-xs rounded-none font-bold uppercase tracking-wider hover:bg-purple-700"
                  >
                    Ouvrir le lien
                  </a>
                </div>
              ) : (
                <video src={mediaUrl(selectedMedia)} controls preload="metadata" className="max-h-[55dvh] max-w-full rounded-none md:max-h-[calc(100dvh-2rem)]" />
              )}
            </div>

            {/* Sidebar info */}
            <div className="flex flex-col justify-between space-y-4 p-6 md:w-2/5 md:overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-sept-blue-strong uppercase break-words font-serif">
                    {selectedMedia.title || selectedMedia.original_name || 'Sans titre'}
                  </h3>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 border border-gray-200 hover:border-gray-400 rounded-none transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-3">
                  {selectedMedia.original_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fichier:</span>
                      <span className="font-mono text-gray-700 truncate max-w-[180px]">{selectedMedia.original_name}</span>
                    </div>
                  )}
                  {selectedMedia.mime_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="font-semibold text-gray-700">{selectedMedia.mime_type}</span>
                    </div>
                  )}
                  {selectedMedia.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Taille:</span>
                      <span className="font-semibold text-gray-700">{(selectedMedia.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                  {selectedMedia.processing_error && (
                    <p className="text-amber-700 bg-amber-50 rounded-none border border-amber-200 p-2 font-mono text-[11px]">{selectedMedia.processing_error}</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <span className="capitalize text-gray-700 font-semibold">{selectedMedia.source}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">Statut :</span>
                    <span className={`font-semibold ${selectedMedia.is_used ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedMedia.is_used ? `Utilisé (${Object.values(selectedMedia.references || {}).reduce((total, count) => total + count, 0)})` : 'Non utilisé'}
                    </span>
                  </div>
                  {selectedMedia.folder && (
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-400">Dossier :</span>
                      <span className="font-mono text-gray-700 truncate">{selectedMedia.folder}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                {isAdmin() ? (
                  <button
                    onClick={(e) => requestRemoveMedia(selectedMedia, e)}
                    className="btn-danger text-xs flex items-center gap-1.5 rounded-none uppercase font-bold tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                ) : (
                  <span />
                )}

                <button
                  onClick={() => setSelectedMedia(null)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
