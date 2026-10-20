import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const SITE_URL = 'https://septentrional.tg'

/**
 * Fil d'Ariane visuel + données structurées BreadcrumbList (schema.org) en JSON-LD,
 * pour permettre à Google d'afficher le chemin de navigation dans les résultats
 * de recherche au lieu de la simple URL.
 *
 * @param {{ items: Array<{ label: string, path?: string }> }} props
 *   Le dernier élément (page courante) ne doit pas avoir de `path`.
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, '\\u003c')}
        </script>
      </Helmet>
      <nav aria-label="Fil d'Ariane" className="text-sm text-gray-500 mb-4">
        {items.map((item, index) => (
          <span key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="inline w-3.5 h-3.5 mx-1.5 -mt-0.5 text-gray-400" aria-hidden="true" />}
            {item.path ? (
              <Link to={item.path} className="hover:text-sept-blue-strong">{item.label}</Link>
            ) : (
              <span className="text-gray-700 font-medium" aria-current="page">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
