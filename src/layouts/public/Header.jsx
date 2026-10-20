import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useSiteSettings } from '@features/public/contexts/SiteSettingsContext';
import { safeUrl } from '@shared/utils/url'
import { publicApi } from '@services/api/public'
import { getList, sortCategories } from '@features/public/utils/articles'

const MAIN_NAV = [
  { path: '/', label: 'ACCUEIL' },
  { path: '/actualites', label: 'ACTUALITÉS' },
  { path: '/politique', label: 'POLITIQUE' },
  { path: '/autres-rubriques', label: 'AUTRES RUBRIQUES' },
  { path: '/a-propos', label: 'À PROPOS' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rubriquesOpen, setRubriquesOpen] = useState(false); // survol desktop
  const [mobileRubriquesOpen, setMobileRubriquesOpen] = useState(false); // accordéon mobile
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const { social } = useSiteSettings();

  const isActive = (path) => location.pathname === path;

  // Sous-menu "Rubriques" : catégories réelles du CMS (Présidence du Conseil,
  // Assemblée Nationale, Sport, Éducation...), pour une navigation interne
  // claire — ce sont ces liens que Google peut choisir de reprendre comme
  // sitelinks sous le résultat du site dans les recherches.
  useEffect(() => {
    publicApi.getCategories()
      .then((res) => setCategories(sortCategories(getList(res))))
      .catch(() => setCategories([]));
  }, []);

  // Ne dépend que de `categories` (chargées une fois) — pas des états de
  // survol/accordéon qui font re-render Header bien plus souvent.
  const siteNavigationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      ...MAIN_NAV.map(({ path, label }, index) => ({
        '@type': 'SiteNavigationElement',
        position: index + 1,
        name: label.charAt(0) + label.slice(1).toLowerCase(),
        url: `https://septentrional.tg${path}`,
      })),
      ...categories.map((cat, index) => ({
        '@type': 'SiteNavigationElement',
        position: MAIN_NAV.length + index + 1,
        name: cat.nom || cat.name,
        url: `https://septentrional.tg/categorie/${cat.slug}`,
      })),
    ],
  }), [categories])

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileRubriquesOpen(false);
  }, [location.pathname]);

  // Track scroll for subtle header effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bg-white sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      {/* Toujours rendu, même si les catégories n'ont pas encore chargé (ou ont
          échoué) : la nav principale statique ne dépend pas de cet appel. */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(siteNavigationSchema).replace(/</g, '\\u003c')}
        </script>
      </Helmet>
      {/* Top bar */}
      <div className="bg-sept-blue">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-[30px]">
            <div className="flex items-center gap-4 text-white text-[10px] md:text-xs font-sans font-medium min-w-0">
              <span className="truncate">Septentrional<span className="hidden sm:inline"> — Actualités du Togo</span></span>
            </div>
            <div className="flex items-center gap-2">
              {social.facebook && (<a href={safeUrl(social.facebook)} target="_blank" rel="noopener noreferrer" className="w-[22px] h-[22px] rounded-none bg-white text-blue-600 flex items-center justify-center text-[11px] hover:scale-110 transition-transform">
                <i className="fab fa-facebook-f"></i>
              </a>)}
              {social.youtube && (<a href={safeUrl(social.youtube)} target="_blank" rel="noopener noreferrer" className="w-[22px] h-[22px] rounded-none bg-white text-red-600 flex items-center justify-center text-[11px] hover:scale-110 transition-transform">
                <i className="fab fa-youtube"></i>
              </a>)}
              {social.twitter && (<a href={safeUrl(social.twitter)} target="_blank" rel="noopener noreferrer" className="w-[22px] h-[22px] rounded-none bg-white text-blue-400 flex items-center justify-center text-[11px] hover:scale-110 transition-transform">
                <i className="fab fa-twitter"></i>
              </a>)}
              {social.tiktok && (<a href={safeUrl(social.tiktok)} target="_blank" rel="noopener noreferrer" className="w-[22px] h-[22px] rounded-none bg-white text-black flex items-center justify-center text-[11px] hover:scale-110 transition-transform">
                <i className="fab fa-tiktok"></i>
              </a>)}
              {social.whatsapp && (<a href={safeUrl(social.whatsapp)} target="_blank" rel="noopener noreferrer" className="w-[22px] h-[22px] rounded-none bg-white text-green-500 flex items-center justify-center text-[11px] hover:scale-110 transition-transform">
                <i className="fab fa-whatsapp"></i>
              </a>)}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-sept-accent"></div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center relative py-3">
          {/* Navigation centrée */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-9 font-sans">
            {MAIN_NAV.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm lg:text-[15px] font-bold tracking-wider uppercase transition-colors duration-200 ${
                  isActive(path)
                    ? 'nav-active'
                    : 'text-gray-800 hover:text-sept-accent'
                }`}
              >
                {label}
              </Link>
            ))}
            {categories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setRubriquesOpen(true)}
                onMouseLeave={() => setRubriquesOpen(false)}
              >
                <Link
                  to="/autres-rubriques"
                  className="flex items-center gap-1 text-sm lg:text-[15px] font-bold tracking-wider uppercase text-gray-800 hover:text-sept-accent transition-colors duration-200"
                  aria-haspopup="true"
                  aria-expanded={rubriquesOpen}
                >
                  <span>RUBRIQUES</span>
                  <ChevronDown className="w-4 h-4" />
                </Link>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-150 z-50 ${
                    rubriquesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1 bg-white rounded-none shadow-xl border border-gray-100 p-4 min-w-[420px]">
                    {categories.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          to={`/categorie/${cat.slug}`}
                          className="block px-2 py-1.5 rounded-none text-sm font-semibold font-sans text-gray-700 hover:text-sept-accent hover:bg-sept-accent/5 transition-colors whitespace-nowrap"
                        >
                          {cat.nom || cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </nav>

          {/* Bouton burger mobile */}
          <div className="flex md:hidden items-center justify-end w-full">
            <button
              onClick={() => {
                setMobileMenuOpen((open) => !open);
                setMobileRubriquesOpen(false);
              }}
              className="w-10 h-10 bg-sept-blue hover:bg-sept-blue-dark text-white rounded-none flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-sept-blue"></div>

      {/* Mobile menu — animated slide */}
      <div
        className={`md:hidden overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1 font-sans">
            {MAIN_NAV.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`block py-2.5 px-3 rounded-none text-sm font-bold tracking-wide uppercase transition-colors duration-200 ${
                  isActive(path)
                    ? 'text-sept-accent bg-sept-accent/5 font-extrabold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {categories.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setMobileRubriquesOpen((open) => !open)}
                  className="flex items-center justify-between w-full py-2.5 px-3 rounded-none text-sm font-bold tracking-wide uppercase text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-expanded={mobileRubriquesOpen}
                >
                  <span>RUBRIQUES</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileRubriquesOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileRubriquesOpen && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pl-3 pb-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/categorie/${cat.slug}`}
                        className="block py-2 px-3 rounded-none text-sm font-medium font-sans text-gray-600 hover:bg-gray-50 hover:text-sept-accent transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.nom || cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
