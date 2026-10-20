import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { getList } from '@features/public/utils/articles'
import TiptapEditor from '@features/admin/components/TiptapEditor'
import { Send, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfirm } from '@shared/components/ConfirmDialog'

export default function NewsletterSend() {
  const confirm = useConfirm()
  const [formData, setFormData] = useState({ titre: '', contenu: '' })
  const [sending, setSending] = useState(false)
  const [nbAbonnes, setNbAbonnes] = useState(null)

  useEffect(() => {
    adminApi.getAbonnes()
      .then((res) => {
        const abonnes = getList(res)
        setNbAbonnes(abonnes.filter(a => a.statut === 'actif').length)
      })
      .catch(() => setNbAbonnes(null))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, contenu: content }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const confirmMessage = nbAbonnes !== null
      ? `Envoyer cette newsletter à ${nbAbonnes} abonné(s) actif(s) ?`
      : 'Envoyer cette newsletter à tous les abonnés actifs ?'
    if (!await confirm({ title: 'Envoyer la newsletter ?', message: confirmMessage, confirmLabel: 'Envoyer' })) return

    setSending(true)
    try {
      const res = await adminApi.sendNewsletter(formData)
      toast.success(res.data?.message || 'Newsletter envoyée')
      setFormData({ titre: '', contenu: '' })
    } catch (error) {
      toast.error('Erreur lors de l\'envoi: ' + (error.response?.data?.message || error.message || 'Erreur inconnue'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Campagnes d'Information</span>
        <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
          <Mail className="w-6 h-6 text-sept-accent" />
          Envoyer une Newsletter
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Diffusion éditoriale adressée à <span className="font-bold text-sept-blue-strong">{nbAbonnes !== null ? `${nbAbonnes} abonné(s) actif(s)` : 'tous les abonnés actifs'}</span>. Un résumé automatique des derniers articles est également expédié chaque semaine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="Objet de l'email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
            <TiptapEditor value={formData.contenu} onChange={handleContentChange} height={350} />
          </div>
        </div>

        <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Send className="w-5 h-5" />
          {sending ? 'Envoi...' : 'Envoyer la newsletter'}
        </button>
      </form>
    </div>
  )
}
