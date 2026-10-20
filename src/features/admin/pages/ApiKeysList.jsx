import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { getList } from '@features/public/utils/articles'
import { KeyRound, Plus, Ban, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfirm } from '@shared/components/ConfirmDialog'

export default function ApiKeysList() {
  const confirm = useConfirm()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [revealedKey, setRevealedKey] = useState(null) // { name, plainText }
  const [copied, setCopied] = useState(false)

  const loadKeys = async () => {
    try {
      const res = await adminApi.getApiKeys()
      setKeys(getList(res))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des clés API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKeys()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminApi.createApiKey({ name })
      setRevealedKey({ name, plainText: res.data.key })
      setName('')
      setShowForm(false)
      loadKeys()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la clé')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (key) => {
    if (!await confirm({
      title: 'Révoquer cette clé ?',
      message: `Toute application utilisant "${key.name}" perdra immédiatement l'accès à l'API.`,
      confirmLabel: 'Révoquer',
    })) return
    try {
      await adminApi.revokeApiKey(key.id)
      toast.success('Clé révoquée')
      loadKeys()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revealedKey.plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copie impossible, sélectionnez le texte manuellement')
    }
  }

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Sécurité & Développeurs</span>
          <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-sept-accent" />
            Clés d'Accès API
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {showForm ? 'Fermer le formulaire' : 'Nouvelle clé'}
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-4 rounded-none max-w-2xl">
        <p className="text-xs text-gray-600 leading-relaxed">
          Ces clés sont obligatoires pour toutes les requêtes API (en-tête HTTP <code className="bg-white border border-gray-200 px-1 py-0.5 rounded-none font-mono text-sept-blue-strong">X-API-Key</code>).
          La clé du site public est intégrée au front. Réservez la génération de clés aux applications mobiles ou partenaires tiers à isoler.
        </p>
      </div>

      {revealedKey && (
        <div className="bg-amber-50 border-l-4 border-amber-500 border border-amber-200 rounded-none p-4 max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Clé « {revealedKey.name} » générée — Copiez-la immédiatement (elle ne sera plus visible) :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-300 rounded-none px-3 py-2 text-xs font-mono break-all text-amber-950">
              {revealedKey.plainText}
            </code>
            <button onClick={handleCopy} className="p-2 rounded-none bg-amber-600 text-white hover:bg-amber-700 transition shrink-0" title="Copier">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="text-xs text-amber-800 font-bold hover:underline">
            J&apos;ai copié la clé, masquer
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4 max-w-xl">
          <h2 className="text-xs uppercase font-bold tracking-wider text-sept-blue-strong border-b border-gray-100 pb-2">
            Générer une nouvelle clé API
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Nom de l'application / Partenaire *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ex: Application Mobile iOS, Partenaire Kara..."
              className="input-field"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Création...' : 'Générer la clé'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Nom</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Préfixe</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Créée par</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Dernier usage</th>
              <th className="px-4 py-3 text-xs uppercase font-bold tracking-wider">Statut</th>
              <th className="px-4 py-3 text-right text-xs uppercase font-bold tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keys.map((k) => (
              <tr key={k.id} className={`hover:bg-gray-50 transition ${!k.is_active ? 'opacity-50 bg-gray-50/50' : ''}`}>
                <td className="px-4 py-3 font-bold text-sept-blue-strong uppercase">{k.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{k.prefix}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{k.created_by || '—'}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleString('fr-FR') : 'Jamais'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${k.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {k.is_active ? 'Active' : 'Révoquée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {k.is_active && (
                    <button onClick={() => handleRevoke(k)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-gray-200 rounded-none transition" title="Révoquer">
                      <Ban className="w-4 h-4" />
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
