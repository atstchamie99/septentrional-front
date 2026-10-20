import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { publicApi } from '@services/api/public'
import TiptapEditor from '@features/admin/components/TiptapEditor'
import MediaPickerModal from '@features/admin/components/MediaPickerModal'
import { Save, ArrowLeft, Image, Tag, FileText, Calendar, AlertTriangle, Globe, Eye, FolderPlus, X } from 'lucide-react'
import { resolveImageUrl } from '@features/public/utils/articles'
import toast from 'react-hot-toast'

export default function ArticleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    titre: '',
    redacteur_nom: '',
    slug: '',
    extrait: '',
    contenu: '',
    categorie_id: '',
    categorie_ids: [],
    statut: 'brouillon',
    est_alerte: false,
    meta_titre: '',
    meta_description: '',
    date_publication: '',
    image_principale: null,
    remove_image: false,
    etiquette_ids: [],
  })

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [selectedMediaId, setSelectedMediaId] = useState(null)

  useEffect(() => {
    loadCategories()
    if (isEditing) loadArticle()
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await publicApi.getCategories()
      setCategories(res.data.data || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    }
  }

  const loadArticle = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getArticle(id)
      const article = res.data?.data || res.data
      if (article) {
        setFormData({
          titre: article.titre || '',
          redacteur_nom: article.redacteur_nom || '',
          slug: article.slug || '',
          extrait: article.extrait || '',
          contenu: article.contenu || '',
          categorie_id: article.categorie_id || article.categorie?.id || '',
          categorie_ids: article.categories?.map(category => category.id) || [],
          statut: article.statut || 'brouillon',
          est_alerte: article.est_alerte || false,
          meta_titre: article.meta_titre || '',
          meta_description: article.meta_description || '',
          date_publication: article.date_publication ? article.date_publication.slice(0, 16) : '',
          image_principale: null,
          remove_image: false,
          etiquette_ids: article.etiquettes?.map(e => e.id) || article.etiquette_ids || [],
        })
        setPreviewImage(resolveImageUrl(article.image_principale || article.image_principale_url))
      }
    } catch (error) {
      console.error('Erreur chargement article:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
      setSelectedMediaId(null)
      setFormData(prev => ({ ...prev, remove_image: false }))
      if (files[0]) setPreviewImage(URL.createObjectURL(files[0]))
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleMediaSelect = (media) => {
    if (media) {
      setSelectedMediaId(media.id || null)
      setPreviewImage(resolveImageUrl(media.url))
      setFormData(prev => ({ ...prev, image_principale: null, remove_image: false }))
    }
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, contenu: content }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSend = {
        titre: formData.titre,
        redacteur_nom: formData.redacteur_nom || null,
        slug: formData.slug || null,
        extrait: formData.extrait,
        contenu: formData.contenu,
        categorie_id: formData.categorie_id || null,
        categorie_ids: [...new Set([...formData.categorie_ids, Number(formData.categorie_id)])].filter(Boolean),
        statut: formData.statut,
        est_alerte: formData.est_alerte ? 1 : 0,
        meta_titre: formData.meta_titre || '',
        meta_description: formData.meta_description || '',
        date_publication: formData.date_publication || null,
        image_principale: formData.image_principale,
        image_media_id: selectedMediaId,
        remove_image: formData.remove_image ? 1 : null,
        etiquette_ids: formData.etiquette_ids || [],
      }

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' && key !== 'contenu' && key !== 'extrait' && key !== 'meta_titre' && key !== 'meta_description') {
          delete dataToSend[key]
        }
      })

      if (isEditing) {
        await adminApi.updateArticle(id, dataToSend)
        toast.success('Article mis à jour avec succès.')
      } else {
        await adminApi.createArticle(dataToSend)
        toast.success('Article créé avec succès.')
      }
      navigate('/management/septentrional/articles')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      const errors = error.response?.data?.errors
      const firstError = errors && typeof errors === 'object'
        ? Object.values(errors).flat()[0]
        : null
      const message = firstError || error.response?.data?.message || 'Erreur lors de la sauvegarde'
      console.error('Détail de la sauvegarde:', error.response?.data)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <button onClick={() => navigate('/management/septentrional/articles')} className="p-2 border border-gray-200 text-gray-600 hover:text-sept-blue-strong hover:bg-gray-50 rounded-none transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Rédaction & Publication</span>
          <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide">
            {isEditing ? "Modifier l'article" : 'Nouvel article'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Titre + Slug */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="w-full text-3xl font-serif font-bold text-gray-900 border-none outline-none focus:ring-0 placeholder-gray-300 bg-transparent"
            placeholder="Titre de l'article..."
            required
          />
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 font-mono text-xs">septentrional.tg/article/</span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="flex-1 font-mono text-xs text-gray-500 border-b border-dashed border-gray-300 focus:border-sept-blue-strong focus:outline-none bg-transparent pb-0.5"
              placeholder="slug-de-l-article"
            />
          </div>
        </div>

        {/* Éditeur */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
          <TiptapEditor
            value={formData.contenu}
            onChange={handleContentChange}
            height={500}
          />
          <input type="hidden" name="contenu" value={formData.contenu} />
        </div>

        {/* Extrait */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-sept-accent" />
            Extrait du chapeau éditorial *
          </label>
          <textarea
            name="extrait"
            value={formData.extrait}
            onChange={handleChange}
            className="input-field min-h-[80px]"
            placeholder="Résumé ou chapeau d'article..."
            required
          />
        </div>

        {/* Métadonnées - 3 colonnes */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            <Tag className="w-4 h-4" />
            Paramètres de l'article
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie *</label>
              <select
                name="categorie_id"
                value={formData.categorie_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Sélectionner...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>

            <fieldset className="md:col-span-2 lg:col-span-3">
              <legend className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Rubriques supplémentaires</legend>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-none border border-gray-200 p-3 bg-gray-50/50">
                {categories.filter(category => Number(category.id) !== Number(formData.categorie_id)).map(category => (
                  <label key={category.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded-none text-sept-blue-strong focus:ring-0 border-gray-300"
                      checked={formData.categorie_ids.map(Number).includes(Number(category.id))}
                      onChange={event => setFormData(previous => ({ ...previous, categorie_ids: event.target.checked
                        ? [...previous.categorie_ids, Number(category.id)]
                        : previous.categorie_ids.filter(id => Number(id) !== Number(category.id)) }))} />
                    {category.nom}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Statut */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="input-field"
              >
                <option value="brouillon">Brouillon</option>
                <option value="publie">Publié</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            {/* Date de publication */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Date de publication
              </label>
              <input
                type="datetime-local"
                name="date_publication"
                value={formData.date_publication}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Signature éditoriale */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Nom et prénom du rédacteur</label>
              <input
                type="text"
                name="redacteur_nom"
                value={formData.redacteur_nom}
                onChange={handleChange}
                maxLength={255}
                className="input-field"
                placeholder="Ex. Kofi Mensah"
              />
              <p className="mt-1 text-xs text-gray-400">Affiché comme signature sur la page de l’article.</p>
            </div>

            {/* Image principale */}
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-sept-blue-strong" />
                Image principale
              </label>

              {previewImage && (
                <div className="relative mb-2 rounded-none overflow-hidden border border-gray-200 shadow-sm max-w-md">
                  <img src={previewImage} alt="Preview" className="w-full h-44 object-cover rounded-none" />
                  <button
                    type="button"
                    onClick={() => { setPreviewImage(null); setSelectedMediaId(null); setFormData(prev => ({ ...prev, image_principale: null, remove_image: true })) }}
                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white rounded-none p-1.5 shadow"
                    title="Supprimer l'image sélectionnée"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="image-field-media-btn"
                >
                  <FolderPlus className="w-4 h-4" />
                  Choisir depuis la médiathèque
                </button>

                <span className="text-xs text-gray-400 font-medium">ou</span>

                <input
                  type="file"
                  name="image_principale"
                  onChange={handleChange}
                  accept="image/*"
                  className="text-xs text-gray-500 rounded-none file:mr-3 file:py-1.5 file:px-3 file:rounded-none file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>

            {/* Alerte */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="est_alerte"
                  checked={formData.est_alerte}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-500 rounded-none border-gray-300 focus:ring-0"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Breaking News (Flash Alerte)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sept-blue-strong mb-4 border-b border-gray-100 pb-2">
            <Eye className="w-4 h-4 text-sept-accent" />
            Référencement & Balises SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                <span>Meta titre</span>
                <span className={`text-[10px] font-mono ${formData.meta_titre.length > 230 ? 'text-amber-600' : 'text-gray-400'}`}>{formData.meta_titre.length}/255</span>
              </label>
              <input
                type="text"
                name="meta_titre"
                value={formData.meta_titre}
                onChange={handleChange}
                maxLength={255}
                className="input-field"
                placeholder="Titre affiché dans les moteurs de recherche"
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                <span>Meta description</span>
                <span className={`text-[10px] font-mono ${formData.meta_description.length > 450 ? 'text-amber-600' : 'text-gray-400'}`}>{formData.meta_description.length}/500</span>
              </label>
              <textarea
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                maxLength={500}
                className="input-field min-h-[80px]"
                placeholder="Description affichée dans les moteurs de recherche"
              />
            </div>
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <div className="flex justify-end sticky bottom-6 z-40">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 px-10 py-3.5 shadow-lg rounded-none text-base font-bold uppercase tracking-wider"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Sauvegarde en cours...' : (isEditing ? 'Mettre à jour' : "Publier l'article")}
          </button>
        </div>
        {/* Modal de sélection médiathèque */}
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleMediaSelect}
          type="image"
        />
      </form>
    </div>
  )
}
