import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import apiClient from '@services/api/client'
import type { User, LoginResponse, LoginResult, OtpChallenge, AuthContextType } from '@shared/types'

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth on mount
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté via les cookies
    apiClient
      .get('/me')
      .then((res) => setUser(res.data.data || res.data))
      .catch(() => {
        // Si le cookie n'est plus valide, on laisse l'appelant gérer l'état local.
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResult>('/login', {
      email,
      password,
    })

    if ('requires_otp' in data) {
      return data
    }

    // Le token est géré par les cookies HttpOnly, on stocke uniquement l'utilisateur
    setUser(data.user)
    return data
  }, [])

  const verifyOtp = useCallback(async (challengeToken: string, code: string) => {
    const { data } = await apiClient.post<LoginResponse>('/login/verify-otp', {
      challenge_token: challengeToken,
      code,
    })
    // Le token est géré par les cookies HttpOnly
    setUser(data.user)
    return data
  }, [])

  const reverifyOtp = useCallback(async (code: string, challengeToken?: string) => {
    const { data } = await apiClient.post<LoginResponse>('/reauth/verify-otp', { code, challenge_token: challengeToken })
    setUser(data.user)
    return data
  }, [])

  const sendEmailOtp = useCallback(async (challengeToken?: string, reauth = false) => {
    const { data } = await apiClient.post<OtpChallenge>(
      reauth ? '/reauth/send-email-otp' : '/login/send-email-otp',
      { challenge_token: challengeToken },
    )
    return data
  }, [])

  const changePassword = useCallback(async (currentPassword: string, password: string, passwordConfirmation: string) => {
    const { data } = await apiClient.put('/me/password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    })
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/logout')
    } catch {
      // Ignore errors during logout
    }
    // Le cookie sera supprimé par le backend, on vide juste l'état local
    setUser(null)
  }, [])

  const isAdmin = useCallback(() => user?.role === 'admin', [user])
  const isRedacteur = useCallback(() => user?.role === 'redacteur', [user])
  const isStaff = useCallback(
    () => isAdmin() || isRedacteur(),
    [isAdmin, isRedacteur]
  )

  const value: AuthContextType = {
    user,
    loading,
    login,
    verifyOtp,
    reverifyOtp,
    sendEmailOtp,
    changePassword,
    logout,
    isAdmin,
    isRedacteur,
    isStaff,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
