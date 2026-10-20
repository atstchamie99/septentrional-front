import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@features/auth/AuthContext'
import { ADMIN_LOGIN_PATH } from '@app/routes/authRoutes'
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'
import { getOtpFailure } from '../otpFailure'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, verifyOtp, reverifyOtp, sendEmailOtp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Étape OTP (null tant qu'on est sur le formulaire email/mot de passe)
  const [otpChallenge, setOtpChallenge] = useState(() => (
    searchParams.get('reauth') === '1' ? { reauth: true } : null
  ))
  const [otpCode, setOtpCode] = useState('')
  const [authenticatorChallenge, setAuthenticatorChallenge] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (result?.requires_otp) {
        setOtpCode('')
        setOtpChallenge(result)
      } else {
        navigate('/management/septentrional')
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Identifiants incorrects'
      setError(message)
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (otpChallenge.reauth) {
        await reverifyOtp(otpCode.trim(), otpChallenge.otp_method === 'email' ? otpChallenge.challenge_token : undefined)
      } else {
        await verifyOtp(otpChallenge.challenge_token, otpCode.trim())
      }
      navigate('/management/septentrional')
    } catch (error) {
      const failure = getOtpFailure(error, Boolean(otpChallenge.reauth))
      setError(failure.message)
      if (failure.restartLogin) {
        setOtpChallenge(null)
        setOtpCode('')
        setAuthenticatorChallenge(null)
        if (otpChallenge.reauth) navigate(ADMIN_LOGIN_PATH, { replace: true })
      }
      console.error('OTP verification failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmailOtp = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const result = await sendEmailOtp(otpChallenge.challenge_token, Boolean(otpChallenge.reauth))
      if (otpChallenge.otp_method !== 'email') setAuthenticatorChallenge(otpChallenge)
      setOtpChallenge({ ...result, reauth: otpChallenge.reauth })
      setOtpCode('')
    } catch (error) {
      const failure = getOtpFailure(error, Boolean(otpChallenge.reauth))
      setError(failure.message)
      if (failure.restartLogin) {
        setOtpChallenge(null)
        setAuthenticatorChallenge(null)
        setOtpCode('')
        if (otpChallenge.reauth) navigate(ADMIN_LOGIN_PATH, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  if (otpChallenge) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <MetaTags title="Vérification en deux étapes" noIndex />
        <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border-t-4 border-sept-blue-strong">
          <div className="text-center mb-6 border-b border-gray-200 pb-5">
            <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-3">
              Sécurité du compte
            </div>
            <ShieldCheck className="w-10 h-10 text-sept-blue-strong mx-auto mb-2" />
            <h1 className="text-xl font-serif font-black uppercase text-gray-900">
              {otpChallenge.reauth ? 'Session expirée' : 'Double authentification'}
            </h1>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {otpChallenge.otp_method === 'email'
                ? 'Un code a été envoyé à l’adresse e-mail de votre compte depuis no-reply@septentrional.tg. Il est valable 10 minutes.'
                : otpChallenge.reauth
                ? 'Saisissez le code de votre application Google Authenticator pour réactiver votre session.'
                : otpChallenge.otp_setup_required
                ? "Scannez ce QR code avec Google Authenticator (ou une app compatible) puis saisissez le code généré."
                : 'Saisissez le code affiché dans votre application Google Authenticator.'}
            </p>
          </div>

          {otpChallenge.otp_setup_required && (
            <div className="mb-6 text-center">
              <div
                className="inline-block border border-gray-200 rounded-none p-2 bg-white"
                dangerouslySetInnerHTML={{ __html: otpChallenge.otp_qr_svg }}
              />
              <p className="text-xs text-gray-400 mt-2">
                Impossible de scanner ? Clé manuelle :{' '}
                <span className="font-mono text-gray-600 break-all">{otpChallenge.otp_secret}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 rounded-none text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Code de sécurité à 6 chiffres</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="input-field text-center tracking-[0.5em] text-lg font-mono"
                required
                autoFocus
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-3"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Vérification...' : otpChallenge.reauth ? 'Réactiver la session' : 'Confirmer'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSendEmailOtp}
              className="w-full text-xs font-semibold uppercase tracking-wider text-sept-blue-strong hover:underline disabled:opacity-50 pt-2"
            >
              {otpChallenge.otp_method === 'email' ? 'Renvoyer un code par e-mail' : 'Recevoir un code par e-mail'}
            </button>

            {otpChallenge.otp_method === 'email' && authenticatorChallenge && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setOtpChallenge(authenticatorChallenge)
                  setOtpCode('')
                  setError('')
                }}
                className="w-full text-xs font-semibold uppercase tracking-wider text-sept-blue-strong hover:underline disabled:opacity-50"
              >
                Utiliser Authenticator
              </button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOtpChallenge(null)
                setAuthenticatorChallenge(null)
                setOtpCode('')
                setError('')
                if (otpChallenge.reauth) navigate(ADMIN_LOGIN_PATH, { replace: true })
              }}
              className="w-full text-xs uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700 pt-2"
            >
              {otpChallenge.reauth ? 'Utiliser email et mot de passe' : '← Retour'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <MetaTags title="Connexion administration" noIndex />
      <div className="bg-white rounded-none shadow-2xl p-8 w-full max-w-md border-t-4 border-sept-blue-strong">
        <div className="text-center mb-8 border-b border-gray-200 pb-5">
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-2">
            Console d'Administration
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
            Septentrional
          </h1>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">
            Espace Éditorial & Gestion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 rounded-none text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              placeholder="admin@septentrional.tg"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs font-bold py-3.5"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>

          <div className="text-center pt-2">
            <Link to="/management/septentrional/mot-de-passe-oublie" className="text-xs text-gray-500 hover:text-sept-blue-strong uppercase tracking-wider font-semibold">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-xs uppercase tracking-wider font-bold text-sept-blue-strong hover:underline">
            ← Retour au site public
          </Link>
        </div>
      </div>
    </div>
  )
}
