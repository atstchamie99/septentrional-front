import { useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { Mail, ArrowLeft } from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await publicApi.forgotPassword(email.trim())
      setSent(true)
    } catch {
      // On affiche toujours le même message générique (pas d'énumération de comptes)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <MetaTags title="Mot de passe oublié" noIndex />
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border-t-4 border-sept-blue-strong">
        <div className="text-center mb-8 border-b border-gray-200 pb-5">
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-2">
            Récupération
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
            Septentrional
          </h1>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">
            Mot de passe oublié
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <Mail className="w-10 h-10 text-sept-blue-strong mx-auto" />
            <p className="text-gray-600 text-xs leading-relaxed">
              Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé.
              Vérifiez votre boîte de réception (et vos spams).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                placeholder="votre@email.com"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-3.5">
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/management/septentrional/login" className="text-xs uppercase tracking-wider font-bold text-sept-blue-strong hover:underline flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
