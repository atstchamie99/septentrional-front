interface OtpError {
  message?: string
  response?: {
    status?: number
    data?: { message?: string; code?: string }
    headers?: Record<string, unknown>
  }
}

export function getOtpFailure(error: OtpError, reauth = false) {
  const response = error.response
  if (response?.status === 429) {
    const retryAfter = Number(response.headers?.['retry-after'])
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? `${Math.ceil(retryAfter)} secondes`
      : 'une minute'
    return {
      restartLogin: false,
      message: `Trop de tentatives. Attendez ${delay}, puis saisissez un nouveau code.`,
    }
  }

  // Le message assure la compatibilité avec les API déjà déployées.
  const expired = ['OTP_CHALLENGE_EXPIRED', 'OTP_ATTEMPTS_EXHAUSTED'].includes(response?.data?.code ?? '')
    || (response?.status === 422
      && response.data?.message === 'Session de connexion expirée, veuillez vous reconnecter.')
    || (reauth && response?.status === 401)

  return {
    restartLogin: expired,
    message: response?.data?.message || error.message || 'Code invalide',
  }
}
