import { useState } from 'react'
import { useAuth } from '@features/auth/AuthContext'
import { KeyRound, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MonProfil() {
  const { user, changePassword } = useAuth()
  const [formData, setFormData] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await changePassword(formData.current_password, formData.password, formData.password_confirmation)
      toast.success('Mot de passe mis à jour')
      setFormData({ current_password: '', password: '', password_confirmation: '' })
    } catch (error) {
      toast.error(error.response?.data?.errors?.current_password?.[0] || error.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="border-b border-gray-200 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Paramètres Personnels</span>
        <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-sept-accent" />
          Mon Profil & Sécurité
        </h1>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Session active</span>
        <p className="text-lg font-bold text-sept-blue-strong uppercase">{user?.name}</p>
        <p className="text-xs font-mono text-gray-600 mt-0.5">{user?.email}</p>
        <span className="inline-block mt-3 px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-none">
          Rôle : {user?.role || 'Utilisateur'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-sept-blue-strong flex items-center gap-2 border-b border-gray-100 pb-2">
          <KeyRound className="w-4 h-4 text-sept-accent" />
          Changer mon mot de passe
        </h2>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Mot de passe actuel *</label>
          <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Nouveau mot de passe *</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Confirmation du nouveau mot de passe *</label>
          <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required minLength={8} className="input-field" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </div>
  )
}
