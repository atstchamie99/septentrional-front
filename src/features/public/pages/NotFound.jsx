import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { Home, Search, AlertTriangle } from 'lucide-react'
import { useSiteSettings } from '@features/public/contexts/SiteSettingsContext'
import MetaTags from '@shared/components/MetaTags'

export default function NotFound() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    publicApi.resolveLegacyUrl(pathname).then(response => {
      const destination = response.data?.data?.path
      if (active && typeof destination === 'string' && (/^\/(?:article|pages|categorie)\//.test(destination) || ['/a-propos', '/contact', '/mentions-legales'].includes(destination)) && destination !== pathname) {
        navigate(destination, { replace: true })
      }
    }).catch(() => {})
    return () => { active = false }
  }, [pathname, navigate])
  const settings = useSiteSettings()
  const email = settings?.general?.email || 'info@septentrional.tg'

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <MetaTags
        title="Page introuvable"
        description="Cette page n'existe pas ou n'est plus disponible."
        noIndex
      />
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-white p-6 rounded-full shadow-xl border border-red-50">
            <AlertTriangle className="w-20 h-20 text-red-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 mt-8">
          <h1 className="text-9xl font-black text-gray-200 tracking-tighter">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            Oups ! Page introuvable
          </h2>
          <p className="text-base text-gray-500 max-w-md mx-auto">
            Le contenu ou la page que vous recherchez semble avoir été déplacé ou n'existe plus. 
            Mais ne vous inquiétez pas, vous pouvez toujours retrouver votre chemin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-sept-accent hover:bg-sept-blue-dark transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sept-accent"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <Link
            to="/actualites"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sept-blue-strong"
          >
            <Search className="w-5 h-5 text-gray-400" />
            Parcourir les actualités
          </Link>
        </div>
        
        {/* Footer info (optional) */}
        <div className="pt-12">
          <p className="text-sm text-gray-400">
            Besoin d'aide ? <a href={`mailto:${email}`} className="text-sept-blue-strong hover:underline">Contactez-nous</a>
          </p>
        </div>
      </div>
    </div>
  )
}
