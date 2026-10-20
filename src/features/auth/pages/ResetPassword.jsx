import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { KeyRound } from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await publicApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
      setTimeout(() => navigate('/management/septentrional/login'), 2500)
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstFieldError = errors && Object.values(errors)[0]?.[0]
      setError(firstFieldError || err.response?.data?.message || 'Erreur lors de la réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <MetaTags title="Réinitialisation du mot de passe" noIndex />
        <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md text-center border-t-4 border-sept-blue-strong">
          <p className="text-gray-700 text-sm">Lien de réinitialisation invalide ou expiré.</p>
          <Link to="/management/septentrional/mot-de-passe-oublie" className="text-xs uppercase tracking-wider font-bold text-sept-blue-strong hover:underline mt-4 inline-block">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <MetaTags title="Nouveau mot de passe" noIndex />
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border-t-4 border-sept-blue-strong">
        <div className="text-center mb-8 border-b border-gray-200 pb-5">
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-2">
            Sécurité
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
            Septentrional
          </h1>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">
            Nouveau mot de passe pour {email}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border-l-4 border-green-600 text-green-800 p-4 rounded-none text-xs font-medium text-center">
            Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 rounded-none text-xs font-medium">{error}</div>}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Confirmation du mot de passe</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="input-field"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-3.5">
              <KeyRound className="w-4 h-4" />
              {loading ? 'Réinitialisation en cours...' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
