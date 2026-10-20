import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ADMIN_LOGIN_PATH } from '@app/routes/authRoutes'
import { useAuth } from '@features/auth/AuthContext'

interface ProtectedAdminRouteProps {
  children: ReactNode
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const { user, loading, isStaff } = useAuth()

  if (loading) return <div className="text-center py-20">Chargement...</div>
  
  if (!user) {
    console.log('ProtectedAdminRoute: No user found, redirecting to login.')
    return <Navigate to={ADMIN_LOGIN_PATH} replace />
  }

  if (!isStaff()) {
    console.log('ProtectedAdminRoute: User is not staff, redirecting to home. User:', user, 'isStaff:', isStaff())
    return <Navigate to="/" replace />
  }

  return children
}
