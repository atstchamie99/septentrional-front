import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/AuthContext'

// À utiliser en plus de ProtectedAdminRoute pour les écrans réservés à l'admin
// (Catégories, Paramètres, Abonnés, Newsletter, Utilisateurs, Clés API).
// Un rédacteur authentifié qui force l'URL est renvoyé au dashboard.
export default function AdminOnlyRoute({ children }) {
  const { isAdmin } = useAuth()

  if (!isAdmin()) return <Navigate to="/management/septentrional" replace />

  return children
}
