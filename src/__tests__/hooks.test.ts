import { renderHook, act } from '@testing-library/react'
import { useApi, useMutation } from '@shared/hooks/useApi'
import type { ApiErrorResponse } from '@shared/types'

// Mock API client
jest.mock('@services/api/client', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const mockApiCall = jest.fn(() => Promise.resolve({ data: {} }))
    const { result } = renderHook(() => useApi(mockApiCall))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('should handle successful API call', async () => {
    const mockData = { id: 1, title: 'Test' }
    const mockApiCall = jest.fn(() =>
      Promise.resolve({ data: mockData })
    )
    const { result } = renderHook(() => useApi(mockApiCall))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle API error', async () => {
    const mockError = new Error('Network error')
    const mockApiCall = jest.fn(() => Promise.reject(mockError))
    const { result } = renderHook(() => useApi(mockApiCall))

    await act(async () => {
      try {
        await result.current.execute()
      } catch {
        // Error expected
      }
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).not.toBe(null)
    expect(result.current.error?.message).toBe('Network error')
  })

  it('should call onSuccess callback', async () => {
    const mockData = { id: 1 }
    const onSuccess = jest.fn()
    const mockApiCall = jest.fn(() =>
      Promise.resolve({ data: mockData })
    )

    const { result } = renderHook(() =>
      useApi(mockApiCall, { onSuccess })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(onSuccess).toHaveBeenCalledWith(mockData)
  })

  it('should call onError callback', async () => {
    const onError = jest.fn()
    const mockApiCall = jest.fn(() =>
      Promise.reject(new Error('API failed'))
    )

    const { result } = renderHook(() =>
      useApi(mockApiCall, { onError })
    )

    await act(async () => {
      try {
        await result.current.execute()
      } catch {
        // Error expected
      }
    })

    expect(onError).toHaveBeenCalled()
  })
})

describe('useMutation Hook', () => {
  it('should handle mutation with payload', async () => {
    const mockData = { success: true }
    const mockApiCall = jest.fn((payload: any) =>
      Promise.resolve({ data: { ...payload, ...mockData } })
    )

    const { result } = renderHook(() => useMutation(mockApiCall))

    const payload = { id: 1 }
    await act(async () => {
      await result.current.mutate(payload)
    })

    expect(mockApiCall).toHaveBeenCalledWith(payload)
    expect(result.current.data).toEqual({ id: 1, success: true })
  })

  it('should handle mutation error', async () => {
    const mockApiCall = jest.fn(() =>
      Promise.reject(new Error('Mutation failed'))
    )

    const { result } = renderHook(() => useMutation(mockApiCall))

    await act(async () => {
      try {
        await result.current.mutate()
      } catch {
        // Error expected
      }
    })

    expect(result.current.error).not.toBe(null)
    expect(result.current.error?.message).toBe('Mutation failed')
  })
})
