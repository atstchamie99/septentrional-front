import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { getList } from '@features/public/utils/articles'
import { useAuth } from '@features/auth/AuthContext'
import { ShieldCheck, UserPlus, Ban, RotateCcw, Shield, PenLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfirm } from '@shared/components/ConfirmDialog'

export default function UtilisateursList() {
  const confirm = useConfirm()
  const { user: currentUser } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', password_confirmation: '', role: 'redacteur',
  })

  const loadUtilisateurs = async () => {
    try {
      const res = await adminApi.getUtilisateurs()
      setUtilisateurs(getList(res))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUtilisateurs()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.createUtilisateur(formData)
      toast.success('Compte créé')
      setFormData({ name: '', email: '', password: '', password_confirmation: '', role: 'redacteur' })
      setShowForm(false)
      loadUtilisateurs()
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstFieldError = errors && Object.values(errors)[0]?.[0]
      toast.error(firstFieldError || error.response?.data?.message || 'Erreur lors de la création du compte')
    } finally {
      setSaving(false)
    }
  }

  const handleSuspendre = async (u) => {
    if (!await confirm({ title: 'Suspendre ce compte ?', message: `Suspendre le compte de ${u.name} ?`, confirmLabel: 'Suspendre' })) return
    try {
      await adminApi.suspendreUtilisateur(u.id)
      toast.success('Compte suspendu')
      loadUtilisateurs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  const handleReactiver = async (u) => {
    try {
      await adminApi.reactiverUtilisateur(u.id)
      toast.success('Compte réactivé')
      loadUtilisateurs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Équipe & Accréditations</span>
          <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sept-accent" />
            Comptes & Utilisateurs
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Fermer le formulaire' : 'Nouveau compte'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4 max-w-xl">
          <h2 className="text-xs uppercase font-bold tracking-wider text-sept-blue-strong border-b border-gray-100 pb-2">
            Créer une nouvelle accréditation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Nom *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Mot de passe *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Confirmation *</label>
              <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required minLength={8} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Rôle *</label>
              <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                <option value="redacteur">Rédacteur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Création...' : 'Créer le compte'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Nom</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Email</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Rôle</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Statut</th>
              <th className="px-4 py-3 text-right text-xs uppercase font-bold tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {utilisateurs.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.is_active ? 'opacity-50 bg-gray-50/50' : ''}`}>
                <td className="px-4 py-3 font-bold text-sept-blue-strong uppercase">{u.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${u.role === 'admin' ? 'bg-sept-blue-strong/10 text-sept-blue-strong border-sept-blue-strong/20' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3 text-sept-accent" /> : <PenLine className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {u.is_active ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === currentUser?.id ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-500 border border-gray-200">Vous</span>
                  ) : u.is_active ? (
                    <button onClick={() => handleSuspendre(u)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-gray-200 rounded-none transition" title="Suspendre">
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleReactiver(u)} className="p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-gray-200 rounded-none transition" title="Réactiver">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
