import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { Save, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OccasionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    titre: '',
    texte: '',
    date_debut: '',
    date_fin: '',
    est_actif: true,
    image: null,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const loadOccasion = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getOccasion(id)
      const occasion = res.data.data || res.data
      if (occasion) {
        setFormData({
          titre: occasion.titre || '',
          texte: occasion.texte || '',
          date_debut: occasion.date_debut || '',
          date_fin: occasion.date_fin || '',
          est_actif: occasion.est_actif ?? true,
          image: null,
        })
        setPreviewImage(occasion.image)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isEditing) loadOccasion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
      if (files[0]) setPreviewImage(URL.createObjectURL(files[0]))
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing) {
        await adminApi.updateOccasion(id, formData)
        toast.success('Occasion mise à jour')
      } else {
        await adminApi.createOccasion(formData)
        toast.success('Occasion créée')
      }
      navigate('/management/septentrional/occasions')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde: ' + (error.response?.data?.message || error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement de l'occasion...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <button onClick={() => navigate('/management/septentrional/occasions')} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-sept-blue-strong mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour aux occasions spéciales
          </button>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
            {isEditing ? "Modifier l'occasion" : 'Nouvelle occasion spéciale'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Titre de l'occasion *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Ex : Bonne année 2027 !"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Texte / Vœux</label>
            <textarea
              name="texte"
              value={formData.texte}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Message affiché sous le titre (optionnel si une image suffit)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Date début *</label>
              <input
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Date fin *</label>
              <input
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 -mt-2">
            L'occasion s'affichera automatiquement sur le site public uniquement pendant cette période.
          </p>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Image d'illustration (optionnelle)</label>
            {previewImage && (
              <img src={previewImage} alt={formData.titre} className="w-24 h-24 rounded-none border border-gray-200 object-cover mb-2" />
            )}
            <input
              type="file"
              name="image"
              onChange={handleChange}
              accept="image/*"
              className="w-full text-xs text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-none file:border-0
                file:text-xs file:font-semibold
                file:bg-gray-800 file:text-white
                hover:file:bg-black"
            />
            {isEditing && !formData.image && (
              <p className="text-[10px] text-gray-500 mt-1">
                Laissez vide pour conserver l'image existante
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="est_actif"
              checked={formData.est_actif}
              onChange={handleChange}
              className="w-4 h-4 text-sept-blue-strong rounded-none"
            />
            <label className="text-xs uppercase font-bold tracking-wider text-gray-700">Activer immédiatement</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/management/septentrional/occasions')}
              className="px-4 py-2.5 border border-gray-300 rounded-none text-xs uppercase tracking-wider font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-2.5 px-6 rounded-none"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
