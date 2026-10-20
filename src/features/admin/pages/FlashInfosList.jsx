import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { Plus, Edit, Trash2, Zap, CheckCircle, XCircle, Power, Search, X, Link as LinkIcon } from 'lucide-react'
import { resolveImageUrl } from '@features/public/utils/articles'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function FlashInfosList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [flashInfos, setFlashInfos] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ texte: '', article_id: '', est_actif: true, date_debut: '', date_fin: '' })
  const [editingId, setEditingId] = useState(null)

  // Article search state
  const [articleSearch, setArticleSearch] = useState('')
  const [articleResults, setArticleResults] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => { loadFlashInfos() }, [])

  const loadFlashInfos = async () => {
    try {
      const res = await adminApi.getFlashInfos()
      setFlashInfos(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  // Debounced article search
  const searchArticles = useCallback(async (query) => {
    setSearchLoading(true)
    try {
      const res = await adminApi.getArticles()
      const articles = res.data?.data || res.data || []
      let filtered = Array.isArray(articles) ? articles : []
      
      if (query && query.length >= 2) {
        filtered = filtered.filter(a => (a.titre || '').toLowerCase().includes(query.toLowerCase()))
      }
      
      setArticleResults(filtered.slice(0, 25))
      setShowDropdown(true)
    } catch (error) {
      console.error('Erreur recherche articles:', error)
      setArticleResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchArticles(articleSearch), 300)
    return () => clearTimeout(timer)
  }, [articleSearch, searchArticles])

  const selectArticle = (article) => {
    setSelectedArticle(article)
    setFormData({ ...formData, article_id: article.id })
    setArticleSearch('')
    setShowDropdown(false)
  }

  const clearArticle = () => {
    setSelectedArticle(null)
    setFormData({ ...formData, article_id: '' })
    setArticleSearch('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        article_id: formData.article_id || null,
      }
      if (editingId) {
        await adminApi.updateFlashInfo(editingId, payload)
      } else {
        await adminApi.createFlashInfo(payload)
      }
      setFormData({ texte: '', article_id: '', est_actif: true, date_debut: '', date_fin: '' })
      setEditingId(null)
      setSelectedArticle(null)
      setArticleSearch('')
      loadFlashInfos()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleEdit = (flash) => {
    setFormData({
      texte: flash.texte,
      article_id: flash.article_id || '',
      est_actif: flash.est_actif,
      date_debut: flash.date_debut ? flash.date_debut.slice(0, 16) : '',
      date_fin: flash.date_fin ? flash.date_fin.slice(0, 16) : '',
    })
    setEditingId(flash.id)
    setSelectedArticle(flash.article || null)
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer ce flash info ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteFlashInfo(id)
      loadFlashInfos()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const toggleActif = async (flash) => {
    try {
      await adminApi.updateFlashInfo(flash.id, { ...flash, est_actif: !flash.est_actif })
      loadFlashInfos()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement des flash infos...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="border-b border-gray-200 pb-4">
        <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
          Urgences & Alertes
        </div>
        <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
          <Zap className="w-5 h-5 text-sept-gold" />
          Flash Infos
        </h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-serif font-bold text-base uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
          {editingId ? 'Modifier le flash info' : 'Nouveau flash info'}
        </h2>
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Texte *</label>
          <textarea
            value={formData.texte}
            onChange={(e) => setFormData({ ...formData, texte: e.target.value })}
            className="input-field min-h-[80px]"
            required
            placeholder="Texte du flash info..."
          />
        </div>

        {/* Article associé */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">
            <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
            Article associé (optionnel)
          </label>
          {selectedArticle ? (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-none p-3">
              {selectedArticle.image_principale && (
                <img src={resolveImageUrl(selectedArticle.image_principale)} alt="" className="w-10 h-10 rounded-none object-cover flex-shrink-0 border border-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{selectedArticle.titre}</p>
                <p className="text-[10px] text-gray-400 font-mono">ID: {selectedArticle.id}</p>
              </div>
              <button
                type="button"
                onClick={clearArticle}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-none transition"
                title="Retirer l'article"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  onFocus={() => {
                    if (articleResults.length === 0) searchArticles(articleSearch)
                    else setShowDropdown(true)
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="input-field pl-10"
                  placeholder="Rechercher un article par titre..."
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-sept-blue-strong/30 border-t-sept-blue-strong rounded-none animate-spin"></div>
                  </div>
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-none shadow-xl max-h-60 overflow-y-auto">
                  {articleResults.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => selectArticle(article)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                    >
                      {article.image_principale && (
                        <img src={resolveImageUrl(article.image_principale)} alt="" className="w-8 h-8 rounded-none object-cover flex-shrink-0 border border-gray-200" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{article.titre}</p>
                        <p className="text-[10px] text-gray-400">
                          {article.date_publication
                            ? new Date(article.date_publication).toLocaleDateString('fr-FR')
                            : 'Brouillon'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-1">
            Si un article est associé, le flash info deviendra cliquable et redirigera vers cet article.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Date début</label>
            <input
              type="datetime-local"
              value={formData.date_debut}
              onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Date fin</label>
            <input
              type="datetime-local"
              value={formData.date_fin}
              onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.est_actif}
                onChange={(e) => setFormData({ ...formData, est_actif: e.target.checked })}
                className="w-4 h-4 text-sept-blue-strong rounded-none"
              />
              <span className="text-xs uppercase tracking-wider font-bold text-gray-700">Actif en continu</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button type="submit" className="btn-primary uppercase tracking-wider text-xs font-bold py-2.5 px-6 rounded-none">
            {editingId ? 'Mettre à jour' : 'Créer le flash'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setFormData({ texte: '', article_id: '', est_actif: true, date_debut: '', date_fin: '' }); setSelectedArticle(null); setArticleSearch('') }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 text-xs uppercase tracking-wider font-semibold transition"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Liste */}
      <div className="space-y-3">
        {flashInfos.map((flash) => (
          <div key={flash.id} className={`bg-white rounded-none shadow-sm p-4 flex items-center justify-between border border-gray-200 border-l-4 ${flash.est_actif ? 'border-l-green-500' : 'border-l-gray-300'}`}>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{flash.texte}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                <span className={`inline-flex px-1.5 py-0.2 rounded-none text-[9px] font-bold uppercase tracking-wider border ${flash.est_actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {flash.est_actif ? 'Actif' : 'Inactif'}
                </span>
                {flash.article && (
                  <span className="flex items-center gap-1 text-sept-blue-strong font-medium">
                    <LinkIcon className="w-3 h-3" />
                    {flash.article.titre}
                  </span>
                )}
                {flash.date_debut && <span>Début: {new Date(flash.date_debut).toLocaleString('fr-FR')}</span>}
                {flash.date_fin && <span>Fin: {new Date(flash.date_fin).toLocaleString('fr-FR')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <button onClick={() => toggleActif(flash)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-none border border-transparent hover:border-gray-200 transition" title="Activer/Désactiver">
                <Power className="w-4 h-4" />
              </button>
              <button onClick={() => handleEdit(flash)} className="p-1.5 text-sept-blue-strong hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-200 transition" title="Modifier">
                <Edit className="w-4 h-4" />
              </button>
              {isAdmin() && (
                <button onClick={() => handleDelete(flash.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {flashInfos.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Aucun flash info enregistré</div>}
      </div>
    </div>
  )
}
