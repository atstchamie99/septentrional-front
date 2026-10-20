import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { Save, Edit, Trash2, Settings, Tag, Type, ToggleLeft, FileJson } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function ParametresList() {
  const confirm = useConfirm()
  const [parametres, setParametres] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ cle: '', valeur: '', type: 'string', groupe: 'general' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { loadParametres() }, [])

  const loadParametres = async () => {
    try {
      const res = await adminApi.getParametres()
      setParametres(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await adminApi.updateParametre(editingId, formData)
      } else {
        await adminApi.createParametre(formData)
      }
      resetForm()
      loadParametres()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleEdit = (param) => {
    setFormData({ cle: param.cle, valeur: param.valeur, type: param.type, groupe: param.groupe })
    setEditingId(param.id)
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer ce paramètre ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteParametre(id)
      loadParametres()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const resetForm = () => {
    setFormData({ cle: '', valeur: '', type: 'string', groupe: 'general' })
    setEditingId(null)
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'boolean': return <ToggleLeft className="w-4 h-4" />
      case 'json': return <FileJson className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Configuration Système</span>
        <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
          <Settings className="w-6 h-6 text-sept-accent" />
          Paramètres Généraux
        </h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-xs uppercase tracking-wider text-sept-blue-strong border-b border-gray-100 pb-2">
          {editingId ? 'Modifier la variable' : 'Nouvelle variable de configuration'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Clé *</label>
            <input type="text" value={formData.cle} onChange={(e) => setFormData({...formData, cle: e.target.value})} className="input-field font-mono text-sm" required placeholder="site_nom" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Groupe</label>
            <input type="text" value={formData.groupe} onChange={(e) => setFormData({...formData, groupe: e.target.value})} className="input-field" placeholder="general" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Valeur</label>
          <textarea value={formData.valeur} onChange={(e) => setFormData({...formData, valeur: e.target.value})} className="input-field min-h-[80px] font-mono text-xs" required />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Type</label>
          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="input-field">
            <option value="string">String (Texte)</option>
            <option value="boolean">Boolean (Vrai/Faux)</option>
            <option value="json">JSON (Structure)</option>
            <option value="fichier">Fichier</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
          {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-100 transition text-xs font-bold uppercase tracking-wider">Annuler</button>}
        </div>
      </form>

      {/* Liste par groupe */}
      {['general', 'systeme', 'social', 'seo'].map(groupe => {
        const groupParams = parametres.filter(p => p.groupe === groupe)
        if (groupParams.length === 0) return null
        return (
          <div key={groupe} className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-wider text-sept-blue-strong">Groupe : {groupe}</h3>
              <span className="text-[10px] font-mono uppercase text-gray-400">{groupParams.length} entrée(s)</span>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                {groupParams.map((param) => (
                  <tr key={param.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{getTypeIcon(param.type)}</span>
                        <span className="text-sm font-mono font-bold text-sept-blue-strong">{param.cle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-xs truncate">{param.valeur}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(param)} className="p-1.5 text-blue-600 hover:bg-blue-600 hover:text-white border border-gray-200 rounded-none transition" title="Modifier"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(param.id)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-gray-200 rounded-none transition" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
