import { useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '@services/api/public'
import { useSiteSettings } from '@features/public/contexts/SiteSettingsContext'
import { safeUrl } from '@shared/utils/url'
import { Mail, Phone, MapPin, Send, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Footer() {
  const [newsletterData, setNewsletterData] = useState({ nom: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const { social, general } = useSiteSettings()

  const handleNewsletter = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await publicApi.subscribeNewsletter(newsletterData)
      toast.success('Inscription à la newsletter réussie !')
      setNewsletterData({ nom: '', email: '' })
    } catch {
      toast.error("Erreur lors de l'inscription à la newsletter")
    } finally {
      setSubmitting(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-sept-blue text-white mt-auto relative overflow-hidden border-t-4 border-sept-blue-dark">
      {/* Liseré supérieur décoratif discret */}
      <div className="h-1 bg-sept-blue-dark/30" />

      {/* Contenu principal du footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Colonne 1 : Identité & Ligne éditoriale */}
          <div className="space-y-4">
            <div>
              <Link to="/" className="inline-block group">
                <span className="font-serif font-black text-2xl tracking-tight text-white group-hover:text-white/80 transition-colors">
                  SEPTENTRIONAL<span className="text-sept-blue-dark">.</span>
                </span>
              </Link>
              <p className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                Journal d'informations & d'actualités au Togo
              </p>
            </div>

            <p className="text-xs text-white/95 leading-relaxed font-medium">
              Le premier média indépendant de référence dédié aux actualités nationales,
              à la vie des régions et aux grands enjeux de société du Togo et de la sous-région.
            </p>

            {/* Réseaux sociaux - boutons carrés stricts blancs sur fond bleu */}
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                Suivez-nous sur les réseaux
              </p>
              <div className="flex flex-wrap gap-2">
                {social.facebook && (
                  <a
                    href={safeUrl(social.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-none bg-white text-sept-blue flex items-center justify-center hover:bg-sept-blue-dark hover:text-white transition-all duration-200 border border-white shadow-xs font-bold"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <i className="fab fa-facebook-f text-sm"></i>
                  </a>
                )}
                {social.twitter && (
                  <a
                    href={safeUrl(social.twitter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-none bg-white text-sept-blue flex items-center justify-center hover:bg-sept-blue-dark hover:text-white transition-all duration-200 border border-white shadow-xs font-bold"
                    aria-label="X (Twitter)"
                    title="X (Twitter)"
                  >
                    <i className="fab fa-twitter text-sm"></i>
                  </a>
                )}
                {social.youtube && (
                  <a
                    href={safeUrl(social.youtube)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-none bg-white text-sept-blue flex items-center justify-center hover:bg-sept-blue-dark hover:text-white transition-all duration-200 border border-white shadow-xs font-bold"
                    aria-label="YouTube"
                    title="YouTube"
                  >
                    <i className="fab fa-youtube text-sm"></i>
                  </a>
                )}
                {social.tiktok && (
                  <a
                    href={safeUrl(social.tiktok)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-none bg-white text-sept-blue flex items-center justify-center hover:bg-sept-blue-dark hover:text-white transition-all duration-200 border border-white shadow-xs font-bold"
                    aria-label="TikTok"
                    title="TikTok"
                  >
                    <i className="fab fa-tiktok text-sm"></i>
                  </a>
                )}
                {social.whatsapp && (
                  <a
                    href={safeUrl(social.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-none bg-white text-sept-blue flex items-center justify-center hover:bg-sept-blue-dark hover:text-white transition-all duration-200 border border-white shadow-xs font-bold"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <i className="fab fa-whatsapp text-sm"></i>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Colonne 2 : Navigation & Rubriques */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-white shrink-0"></span>
              <span>Rubriques</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Accueil</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/actualites"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>À la Une & Actualités</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/politique"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Politique & Institutions</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/presidence-du-conseil"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Présidence du Conseil</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/justice"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Justice & Tribunaux</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/videos"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Vidéos & Grands Formats</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/autres-rubriques"
                  className="text-white/90 hover:text-white transition-colors inline-flex items-center gap-1.5 group font-medium"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                  <span>Toutes les rubriques</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Newsletter Hebdomadaire */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-white shrink-0"></span>
              <span>Newsletter</span>
            </h3>
            <p className="text-xs text-white/95 leading-relaxed font-medium">
              Ne manquez aucune information essentielle : recevez chaque semaine le condensé
              de nos enquêtes et actualités togolaises.
            </p>

            <form onSubmit={handleNewsletter} className="space-y-2.5">
              <div>
                <label htmlFor="footer-nom" className="sr-only">Votre nom</label>
                <input
                  id="footer-nom"
                  type="text"
                  value={newsletterData.nom}
                  onChange={(e) => setNewsletterData({ ...newsletterData, nom: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-none text-gray-900 bg-white border border-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sept-blue-dark transition-all"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
              <div>
                <label htmlFor="footer-email" className="sr-only">Votre adresse email</label>
                <input
                  id="footer-email"
                  type="email"
                  value={newsletterData.email}
                  onChange={(e) => setNewsletterData({ ...newsletterData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-none text-gray-900 bg-white border border-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sept-blue-dark transition-all"
                  placeholder="votre.email@domaine.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sept-blue-dark hover:bg-[#0e68b3] text-white font-black text-xs py-2.5 px-4 rounded-none transition-all duration-200 tracking-wider uppercase flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? 'Inscription...' : "S'abonner gratuitement"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Colonne 4 : Rédaction & Coordonnées */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-white shrink-0"></span>
              <span>Contact & Rédaction</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 text-white group">
                <div className="w-8 h-8 rounded-none bg-white text-sept-blue flex items-center justify-center shrink-0 group-hover:bg-sept-blue-dark group-hover:text-white transition-colors shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-white/80">Courriel</p>
                  <a
                    href={`mailto:${general.email || 'contact@septentrional.tg'}`}
                    className="hover:text-white hover:underline text-white font-semibold transition-colors break-all"
                  >
                    {general.email || 'contact@septentrional.tg'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-white group">
                <div className="w-8 h-8 rounded-none bg-white text-sept-blue flex items-center justify-center shrink-0 group-hover:bg-sept-blue-dark group-hover:text-white transition-colors shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-white/80">Téléphone</p>
                  <a
                    href={`tel:${general.telephone || '+228 90 00 00 00'}`}
                    className="hover:text-white hover:underline text-white font-semibold transition-colors"
                  >
                    {general.telephone || '+228 90 00 00 00'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-white group">
                <div className="w-8 h-8 rounded-none bg-white text-sept-blue flex items-center justify-center shrink-0 group-hover:bg-sept-blue-dark group-hover:text-white transition-colors shadow-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-white/80">Siège & Correspondances</p>
                  <p className="font-semibold text-white">
                    Lomé & Kara, République Togolaise
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/20 flex flex-col gap-1.5">
              <Link
                to="/a-propos"
                className="text-xs text-white/90 hover:text-white transition-colors inline-flex items-center gap-1 group font-semibold"
              >
                <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all" />
                <span>Qui sommes-nous ? (Ligne éditoriale)</span>
              </Link>
              <Link
                to="/contact"
                className="text-xs text-white/90 hover:text-white transition-colors inline-flex items-center gap-1 group font-semibold"
              >
                <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all" />
                <span>Nous contacter / Info rédaction</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Barre inférieure : Liens légaux & Copyright */}
      <div className="border-t border-white/25 py-5 text-center bg-sept-blue-dark/25 flex flex-col items-center justify-center gap-2 px-4">
        {/* Liens légaux */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/90">
          <Link
            to="/mentions-legales"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Politique de confidentialité
          </Link>
          <span className="text-white/60">•</span>
          <Link
            to="/mentions-legales"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Mentions légales
          </Link>
          <span className="text-white/60">•</span>
          <Link
            to="/a-propos"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            À propos
          </Link>
          <span className="text-white/60">•</span>
          <Link
            to="/contact"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Contact
          </Link>
        </div>

        {/* Droits d'auteur */}
        <p className="text-xs text-white/90 font-medium">
          © {currentYear} Septentrional — Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
