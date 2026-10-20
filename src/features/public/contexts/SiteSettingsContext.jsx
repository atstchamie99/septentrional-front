/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { publicApi } from '@services/api/public'

const SiteSettingsContext = createContext(null)

// Valeurs par défaut : utilisées tant que l'admin n'a pas renseigné le paramètre
// correspondant (groupe "social"/"general"/"seo"), pour ne jamais casser l'affichage.
const DEFAULT_SETTINGS = {
  social: { facebook: '', youtube: '', twitter: '', tiktok: '', whatsapp: '' },
  general: { site_name: 'Septentrional', site_description: 'Actualités du Togo', email: '', telephone: '' },
  seo: {},
}

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    let isMounted = true

    publicApi.getParametresPublics()
      .then((res) => {
        if (!isMounted) return
        const data = res.data?.data || res.data || {}
        setSettings({
          social: { ...DEFAULT_SETTINGS.social, ...(data.social || {}) },
          general: { ...DEFAULT_SETTINGS.general, ...(data.general || {}) },
          seo: { ...DEFAULT_SETTINGS.seo, ...(data.seo || {}) },
        })
      })
      .catch((error) => {
        console.error('Erreur chargement paramètres publics:', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    return DEFAULT_SETTINGS
  }
  return context
}
