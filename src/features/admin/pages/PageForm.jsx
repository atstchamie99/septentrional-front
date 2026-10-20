import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import TiptapEditor from '@features/admin/components/TiptapEditor'
import { Save, ArrowLeft, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PageForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    titre: '',
    slug: '',
    contenu: '',
    statut: 'brouillon',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) loadPage()
  }, [id])

  const loadPage = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getPage(id)
      const page = res.data.data || res.data
      if (page) {
        setFormData({
          titre: page.titre || '',
          slug: page.slug || '',
          contenu: page.contenu || '',
          statut: page.statut || 'brouillon',
        })
      }
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, contenu: content }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing) {
        await adminApi.updatePage(id, formData)
      } else {
        await adminApi.createPage(formData)
      }
      navigate('/management/septentrional/pages')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/management/septentrional/pages')} className="p-2 border border-gray-200 text-gray-600 hover:text-sept-blue-strong hover:bg-gray-50 rounded-none transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Pages Institutionnelles</span>
          <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide">
            {isEditing ? 'Modifier la page' : 'Nouvelle page'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
            <input type="text" name="titre" value={formData.titre} onChange={handleChange}
              className="input-field" required placeholder="Titre de la page" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
            <input type="text" name="slug" value={formData.slug} onChange={handleChange}
              className="input-field" required placeholder="a-propos" />
            <p className="text-xs text-gray-400 mt-1">L'URL sera: /pages/{formData.slug}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
            <TiptapEditor value={formData.contenu} onChange={handleContentChange} height={400} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select name="statut" value={formData.statut} onChange={handleChange} className="input-field">
              <option value="brouillon">Brouillon</option>
              <option value="publie">Publié</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer')}
        </button>
      </form>
    </div>
  )
}
