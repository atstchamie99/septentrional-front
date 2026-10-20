import { describe, expect, it } from '@jest/globals'
import apiClient, { API_URL, shouldRedirectForUnauthorizedRequest } from '../client'
import { resolveRequestUrl } from '../url'

describe('resolveRequestUrl', () => {
  it('prefixes standard API paths with the configured base URL', () => {
    expect(resolveRequestUrl('/login', '/api/v2')).toBe('/api/v2/login')
    expect(resolveRequestUrl('me', '/api/v2')).toBe('/api/v2/me')
  })

  it('keeps requests already prefixed with the API base path untouched', () => {
    expect(resolveRequestUrl('/api/v2/me', '/api/v2')).toBe('/api/v2/me')
    expect(resolveRequestUrl('api/v2/me', '/api/v2')).toBe('/api/v2/me')
  })

  it('keeps root paths such as Sanctum and storage untouched', () => {
    expect(resolveRequestUrl('/sanctum/csrf-cookie', '/api/v2')).toBe('/sanctum/csrf-cookie')
    expect(resolveRequestUrl('sanctum/csrf-cookie', '/api/v2')).toBe('/sanctum/csrf-cookie')
    expect(resolveRequestUrl('/storage/image.jpg', '/api/v2')).toBe('/storage/image.jpg')
    expect(resolveRequestUrl('storage/image.jpg', '/api/v2')).toBe('/storage/image.jpg')
  })

  it('preserves root API paths that should not be rewritten', () => {
    expect(resolveRequestUrl('/api/health', '/api/v2')).toBe('/api/health')
    expect(resolveRequestUrl('api/health', '/api/v2')).toBe('/api/health')
  })

  it('preserves fully qualified URLs', () => {
    expect(resolveRequestUrl('https://example.com/test', '/api/v2')).toBe('https://example.com/test')
  })

  it('preserves query strings and hash fragments while resolving relative paths', () => {
    expect(resolveRequestUrl('me?include=roles', '/api/v2')).toBe('/api/v2/me?include=roles')
    expect(resolveRequestUrl('/api/v2/me?include=roles#profile', '/api/v2')).toBe(
      '/api/v2/me?include=roles#profile'
    )
  })

  it('supports absolute base URLs while avoiding duplicated path prefixes', () => {
    expect(resolveRequestUrl('users', 'https://example.com/api/v2')).toBe(
      'https://example.com/api/v2/users'
    )
    expect(resolveRequestUrl('/api/v2/users', 'https://example.com/api/v2')).toBe(
      '/api/v2/users'
    )
    expect(resolveRequestUrl('api/v2/users', 'https://example.com/api/v2')).toBe(
      '/api/v2/users'
    )
  })
})

describe('apiClient request URL resolution', () => {
  it('delegates request URL rewriting to resolveRequestUrl and clears baseURL afterwards', () => {
    const interceptor = (
      apiClient.interceptors.request as typeof apiClient.interceptors.request & {
        handlers: Array<{ fulfilled?: (value: any) => any }>
      }
    ).handlers[0]?.fulfilled

    expect(interceptor).toBeDefined()

    const config = {
      url: 'me?include=roles',
      baseURL: API_URL,
      headers: {},
    }

    const resolvedConfig = interceptor?.(config)

    expect(resolvedConfig.url).toBe(resolveRequestUrl(config.url, API_URL))
    expect(resolvedConfig.baseURL).toBeUndefined()
  })
})

describe('shouldRedirectForUnauthorizedRequest', () => {
  it('redirects only for protected admin API requests', () => {
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/admin/articles')).toBe(true)
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/admin/articles/42')).toBe(true)
  })

  it('does not redirect for auth endpoints that must stay public', () => {
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/login')).toBe(false)
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/reset-password')).toBe(false)
  })

  it('does not redirect for shared auth state requests such as /me', () => {
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/me')).toBe(false)
    expect(shouldRedirectForUnauthorizedRequest('/api/v2/me/password')).toBe(false)
  })
})
