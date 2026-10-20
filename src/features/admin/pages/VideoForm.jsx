import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { publicApi } from '@services/api/public'
import { Save, ArrowLeft, Video } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VideoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    url_video: '',
    video_file: null,
    type_video: 'youtube',
    categorie_id: '',
    statut: 'brouillon',
    date_publication: '',
    miniature: null,
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMiniature, setPreviewMiniature] = useState(null)

  useEffect(() => {
    loadCategories()
    if (isEditing) loadVideo()
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await publicApi.getCategories()
      setCategories(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
  }

  const loadVideo = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getVideo(id)
      const video = res.data.data || res.data
      if (video) {
        setFormData({
          titre: video.titre || '',
          description: video.description || '',
          url_video: video.url_video || '',
          type_video: video.type_video || 'youtube',
          categorie_id: video.categorie_id || '',
          statut: video.statut || 'brouillon',
          date_publication: video.date_publication ? video.date_publication.slice(0, 16) : '',
          miniature: null,
        })
        setPreviewMiniature(video.miniature)
      }
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'miniature' || name === 'video_file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
      if (files[0] && name === 'miniature') {
        setPreviewMiniature(URL.createObjectURL(files[0]))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Vérification : catégorie obligatoire
      if (!formData.categorie_id) {
        toast.error('❌ Veuillez sélectionner une catégorie')
        setSaving(false)
        return
      }
      // Vérification : si upload, fichier vidéo obligatoire
      if (formData.type_video === 'upload' && !formData.video_file) {
        toast.error('❌ Veuillez sélectionner un fichier vidéo pour le type "Upload"')
        setSaving(false)
        return
      }
      // Vérification : titre obligatoire
      if (!formData.titre.trim()) {
        toast.error('❌ Le titre est obligatoire')
        setSaving(false)
        return
      }

      // Nettoyer les champs selon le type de vidéo
      const submitData = { ...formData }
      if (submitData.type_video === 'upload') {
        delete submitData.url_video
        submitData.file = submitData.video_file  // ✅ Renomme video_file → file (standard Laravel pour uploads)
        delete submitData.video_file
      } else {
        delete submitData.video_file
        delete submitData.file
      }

      if (isEditing) {
        await adminApi.updateVideo(id, submitData)
        toast.success('Vidéo mise à jour')
      } else {
        await adminApi.createVideo(submitData)
        toast.success('Vidéo créée')
      }
      navigate('/management/septentrional/videos')
    } catch (error) {
      console.error('Erreur sauvegarde vidéo:', error)
      console.error('Réponse complète:', error.response)
      
      // Afficher les erreurs de validation Laravel
      const responseData = error.response?.data
      const errors = responseData?.errors || responseData?.message
      
      if (errors && typeof errors === 'object') {
        let errorMsg = 'Erreurs de validation:\n'
        for (const [field, messages] of Object.entries(errors)) {
          const fieldName = field === 'file' ? 'Fichier vidéo' : 
                           field === 'url_video' ? 'URL de la vidéo' :
                           field === 'type_video' ? 'Type de vidéo' :
                           field === 'titre' ? 'Titre' :
                           field === 'categorie_id' ? 'Catégorie' :
                           field
          const errorText = Array.isArray(messages) ? messages.join(', ') : messages
          errorMsg += `- ${fieldName}: ${errorText}\n`
        }
        toast.error(errorMsg)
      } else if (responseData?.message) {
        toast.error(responseData.message)
      } else {
        toast.error('Erreur lors de la sauvegarde. Vérifiez que tous les champs obligatoires sont remplis.')
      }
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement de la vidéo...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <button onClick={() => navigate('/management/septentrional/videos')} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-sept-blue-strong mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour aux vidéos
          </button>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
            {isEditing ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Titre de la vidéo *</label>
            <input type="text" name="titre" value={formData.titre} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input-field min-h-[100px]" />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Type de vidéo</label>
            <select name="type_video" value={formData.type_video} onChange={handleChange} className="input-field">
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="upload">Upload un fichier</option>
            </select>
          </div>
          
          {/* Input URL (masqué si upload) */}
          {formData.type_video !== 'upload' && (
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">URL de la vidéo *</label>
              <input type="url" name="url_video" value={formData.url_video} onChange={handleChange} className="input-field" placeholder="https://www.youtube.com/watch?v=..." required />
            </div>
          )}
          
          {/* Input file (affiché si upload) */}
          {formData.type_video === 'upload' && (
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Fichier vidéo *</label>
              <input 
                type="file" 
                name="video_file" 
                onChange={handleChange}
                accept="video/*"
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-black"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Catégorie *</label>
              <select name="categorie_id" value={formData.categorie_id} onChange={handleChange} className="input-field" required disabled={categories.length === 0}>
                <option value="">Sélectionner...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ Aucune catégorie disponible. Veuillez en créer une d'abord.</p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Statut</label>
              <select name="statut" value={formData.statut} onChange={handleChange} className="input-field">
                <option value="brouillon">Brouillon</option>
                <option value="publie">Publié</option>
                <option value="archive">Archivé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Date de publication</label>
            <input type="datetime-local" name="date_publication" value={formData.date_publication} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Miniature</label>
            {previewMiniature && <img src={previewMiniature} alt="Preview" className="w-40 h-24 object-cover rounded-none border border-gray-200 mb-3" />}
            <input type="file" name="miniature" onChange={handleChange} accept="image/*" className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-black" />
          </div>
          <button type="submit" disabled={saving || categories.length === 0} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-3 px-6 rounded-none">
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : (isEditing ? "Mettre à jour" : "Créer la vidéo")}
          </button>
        </div>
      </form>
    </div>
  )
}
