import { describe, expect, it } from '@jest/globals'
import { getOtpFailure } from '../otpFailure'

describe('OTP retries', () => {
  it('keeps the challenge after repeated invalid codes', () => {
    const error = { response: { status: 422, data: { message: 'Code invalide.' } } }
    for (let attempt = 0; attempt < 3; attempt++) {
      expect(getOtpFailure(error).restartLogin).toBe(false)
    }
  })

  it('restarts login when the challenge has expired', () => {
    expect(getOtpFailure({ response: {
      status: 422, data: { code: 'OTP_CHALLENGE_EXPIRED' },
    } }).restartLogin).toBe(true)
    expect(getOtpFailure({ response: {
      status: 422, data: { message: 'Session de connexion expirée, veuillez vous reconnecter.' },
    } }).restartLogin).toBe(true)
  })

  it('keeps the challenge during throttling and explains when to retry', () => {
    expect(getOtpFailure({ response: {
      status: 429, headers: { 'retry-after': '42' },
    } })).toEqual({
      restartLogin: false,
      message: 'Trop de tentatives. Attendez 42 secondes, puis saisissez un nouveau code.',
    })
  })

  it('asks for login only when the reauthentication ticket is unavailable', () => {
    expect(getOtpFailure({ response: { status: 401 } }, true).restartLogin).toBe(true)
    expect(getOtpFailure({ response: { status: 422 } }, true).restartLogin).toBe(false)
    expect(getOtpFailure({ message: 'Network Error' }).restartLogin).toBe(false)
  })

  it('restarts login after exhausting the email code attempts', () => {
    expect(getOtpFailure({ response: {
      status: 422, data: { code: 'OTP_ATTEMPTS_EXHAUSTED' },
    } }).restartLogin).toBe(true)
  })
})
