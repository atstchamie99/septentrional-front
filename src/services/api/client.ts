import axios, {
  AxiosInstance,
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios'
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  isPublicAdminAuthPath,
} from '@app/routes/authRoutes'
import { resolveRequestUrl } from './url'

export const API_URL =
  import.meta.env.VITE_API_URL || '/api/v2'

// Clé d'identification de l'application (pas un secret : visible dans le
// bundle par construction). Sert à exiger un header explicite côté API pour
// filtrer les clients qui n'intègrent pas le site, pas à authentifier un
// utilisateur — ça reste le rôle du token Sanctum en cookie HttpOnly.
const API_KEY = import.meta.env.VITE_API_KEY || ''

const isFormData = (data: unknown) =>
  typeof FormData !== 'undefined' && data instanceof FormData

const removeContentTypeHeader = (config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers)
  headers.delete('Content-Type')
  headers.delete('content-type')
  config.headers = headers
}

const AUTH_REDIRECT_LOCK_KEY = 'admin-auth-redirect-in-progress'
const AUTH_REDIRECT_EXEMPT_API_PATHS = [
  '/login',
  '/login/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/logout',
]
const AUTH_REDIRECT_ELIGIBLE_API_PREFIXES = ['/admin']

const isProtectedAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  if (!path.startsWith(ADMIN_BASE_PATH)) return false
  return !isPublicAdminAuthPath(path)
}

const getRequestPathname = (url?: string): string | null => {
  if (!url) return null

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return new URL(url, base).pathname
  } catch {
    return null
  }
}

const getApiPathname = (url?: string): string | null => {
  const requestPathname = getRequestPathname(url)
  if (!requestPathname) return null

  const apiBasePathname = getRequestPathname(API_URL)
  if (!apiBasePathname || !requestPathname.startsWith(apiBasePathname)) {
    return requestPathname
  }

  const strippedPath = requestPathname.slice(apiBasePathname.length)
  return strippedPath ? `/${strippedPath.replace(/^\/+/, '')}` : '/'
}

const matchesPath = (pathname: string, candidate: string): boolean =>
  pathname === candidate || pathname.startsWith(`${candidate}/`)

export const shouldRedirectForUnauthorizedRequest = (url?: string): boolean => {
  const apiPathname = getApiPathname(url)
  if (!apiPathname) return false

  if (AUTH_REDIRECT_EXEMPT_API_PATHS.some((path) => matchesPath(apiPathname, path))) {
    return false
  }

  return AUTH_REDIRECT_ELIGIBLE_API_PREFIXES.some((path) =>
    matchesPath(apiPathname, path)
  )
}

let isRedirectingToLogin = false

const hasRedirectLock = (): boolean => {
  if (isRedirectingToLogin) return true
  if (typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(AUTH_REDIRECT_LOCK_KEY) === '1'
  } catch {
    return isRedirectingToLogin
  }
}

const setRedirectLock = (): void => {
  isRedirectingToLogin = true
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(AUTH_REDIRECT_LOCK_KEY, '1')
  } catch {
    // Ignore storage failures and keep the in-memory lock.
  }
}

const clearRedirectLockOnPublicAuthRoute = (): void => {
  if (typeof window === 'undefined' || !isPublicAdminAuthPath(window.location.pathname)) {
    return
  }

  isRedirectingToLogin = false

  try {
    window.sessionStorage.removeItem(AUTH_REDIRECT_LOCK_KEY)
  } catch {
    // Ignore storage failures.
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
  },
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  clearRedirectLockOnPublicAuthRoute()

  if (!config.url) return config

  // Single source of truth: all API request URL rewriting must stay in
  // resolveRequestUrl so interceptors and callers do not drift apart.
  config.url = resolveRequestUrl(config.url, API_URL)

  // L'URL a déjà été résolue avec le préfixe /api/v2 (ou est absolue),
  // on supprime baseURL pour qu'axios ne la recombine pas une seconde fois.
  config.baseURL = undefined

  return config
})

/**
 * Request interceptor: Handle FormData requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isFormData(config.data)) {
      removeContentTypeHeader(config)
    }

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle 401 errors
 *
 * Ne redirige vers la page de login QUE pour les requêtes admin protégées.
 * La route courante ne sert qu'à éviter une boucle sur les pages d'auth
 * publiques sous /management ; elle ne détermine plus à elle seule le redirect.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      isProtectedAdminRoute() &&
      shouldRedirectForUnauthorizedRequest(error.config?.url) &&
      !hasRedirectLock()
    ) {
      setRedirectLock()
      window.location.href = `${ADMIN_LOGIN_PATH}?reauth=1`
    }

    return Promise.reject(error)
  }
)

export default apiClient
