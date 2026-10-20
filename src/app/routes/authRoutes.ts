export const ADMIN_BASE_PATH = '/management/septentrional'

export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`
export const ADMIN_FORGOT_PASSWORD_PATH = `${ADMIN_BASE_PATH}/mot-de-passe-oublie`
export const ADMIN_RESET_PASSWORD_PATH = `${ADMIN_BASE_PATH}/reinitialiser-mot-de-passe`

export const PUBLIC_ADMIN_AUTH_PATHS = [
  ADMIN_LOGIN_PATH,
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_RESET_PASSWORD_PATH,
] as const

export const isPublicAdminAuthPath = (pathname: string): boolean =>
  PUBLIC_ADMIN_AUTH_PATHS.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  )
