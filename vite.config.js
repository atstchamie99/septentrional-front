import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Échoue fort et tôt plutôt que de livrer silencieusement un build de prod
  // sans clé API valide (absente, vide, ou texte de substitution non remplacé) :
  // l'API rejette alors TOUTES les requêtes du site (401) sans qu'aucune
  // alerte ne prévienne.
  if (mode === 'production' && (!env.VITE_API_KEY || env.VITE_API_KEY.startsWith('REMPLACER_PAR_'))) {
    throw new Error(
      "VITE_API_KEY est manquante ou contient encore le texte de substitution — génère une vraie clé " +
      "depuis le CMS (Administration > Clés API) et mets à jour .env.production avant de builder.",
    )
  }

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/shared/types'),
    },
  },
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '.septentrional.tg', '.hostingersite.com'],
    port: 5173,
    proxy: {
      '/api/v2': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
