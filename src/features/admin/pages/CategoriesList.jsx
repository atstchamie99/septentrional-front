import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { Plus, Edit, Trash2, Tag, Folder, FolderOpen, Palette } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function CategoriesList() {
  const confirm = useConfirm()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nom: '', slug: '', description: '', couleur: '#38A5F8', icone: '', ordre: 0, parent_id: '',
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories()
      setCategories(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData }
      if (!data.parent_id) delete data.parent_id
      if (editingId) {
        await adminApi.updateCategorie(editingId, data)
      } else {
        await adminApi.createCategorie(data)
      }
      resetForm()
      loadCategories()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleEdit = (cat) => {
    setFormData({
      nom: cat.nom, slug: cat.slug, description: cat.description || '',
      couleur: cat.couleur || '#38A5F8', icone: cat.icone || '',
      ordre: cat.ordre || 0, parent_id: cat.parent_id || '',
    })
    setEditingId(cat.id)
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cette catégorie ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteCategorie(id)
      loadCategories()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const resetForm = () => {
    setFormData({ nom: '', slug: '', description: '', couleur: '#38A5F8', icone: '', ordre: 0, parent_id: '' })
    setEditingId(null)
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Taxonomie Éditoriale</span>
        <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
          <Tag className="w-6 h-6 text-sept-accent" />
          Catégories d'Articles
        </h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-xs uppercase tracking-wider text-sept-blue-strong border-b border-gray-100 pb-2">
          {editingId ? 'Modifier la catégorie' : 'Créer une nouvelle catégorie'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Nom *</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Slug *</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="input-field" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field min-h-[60px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-2"><Palette className="w-4 h-4 text-sept-accent" /> Couleur</label>
            <input type="color" value={formData.couleur} onChange={(e) => setFormData({...formData, couleur: e.target.value})} className="w-full h-10 rounded-none cursor-pointer border border-gray-300 p-0.5 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Icône (classe CSS)</label>
            <input type="text" value={formData.icone} onChange={(e) => setFormData({...formData, icone: e.target.value})} className="input-field" placeholder="bi bi-newspaper" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Ordre</label>
            <input type="number" value={formData.ordre} onChange={(e) => setFormData({...formData, ordre: parseInt(e.target.value)})} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Catégorie parente</label>
          <select value={formData.parent_id} onChange={(e) => setFormData({...formData, parent_id: e.target.value})} className="input-field">
            <option value="">Aucune (catégorie racine)</option>
            {categories.filter(c => c.id !== editingId).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Créer la catégorie'}</button>
          {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-100 transition text-xs font-bold uppercase tracking-wider">Annuler</button>}
        </div>
      </form>

      {/* Liste */}
      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Catégorie</th>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Slug</th>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Couleur</th>
              <th className="px-4 py-3 text-right text-xs uppercase font-bold tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-none border border-black/10 shrink-0" style={{ backgroundColor: cat.couleur }}></div>
                    <span className="text-sm font-bold text-sept-blue-strong uppercase">{cat.nom}</span>
                    {cat.parent_id && <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">(sous-catégorie)</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">/{cat.slug}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600">{cat.couleur}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleEdit(cat)} className="p-1.5 text-blue-600 hover:bg-blue-600 hover:text-white border border-gray-200 rounded-none transition" title="Modifier"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-gray-200 rounded-none transition" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
