import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import MetaTags from '@shared/components/MetaTags'

export default function Desabonnement() {
  const { jeton } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    publicApi.unsubscribeNewsletter(jeton)
      .then(() => { if (isMounted) setStatus('success') })
      .catch(() => { if (isMounted) setStatus('error') })

    return () => { isMounted = false }
  }, [jeton])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <MetaTags
        title="Désabonnement"
        description="Gestion du désabonnement à la newsletter Septentrional."
        noIndex
      />
      {status === 'loading' && (
        <>
          <Loader2 className="w-10 h-10 mx-auto text-sept-blue-strong animate-spin mb-4" />
          <p className="text-gray-600">Traitement de votre demande...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 mx-auto text-sept-blue-strong mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Désabonnement confirmé</h1>
          <p className="text-gray-600">Vous ne recevrez plus la newsletter de Septentrional.</p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Lien invalide ou déjà utilisé</h1>
          <p className="text-gray-600">Ce lien de désabonnement n'est plus valide.</p>
        </>
      )}
      <Link to="/" className="inline-block mt-6 text-sept-blue-strong hover:underline">
        ← Retour à l'accueil
      </Link>
    </div>
  )
}
