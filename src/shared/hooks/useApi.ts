import { useState, useCallback, useEffect } from 'react'
import type { ApiErrorResponse } from '@shared/types'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiErrorResponse | null
}

/**
 * Generic hook for API calls with loading and error states
 */
export function useApi<T>(
  apiCall: () => Promise<any>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: ApiErrorResponse) => void
  }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await apiCall()
      const data = response.data as T
      setState({ data, loading: false, error: null })
      options?.onSuccess?.(data)
      return data
    } catch (err: any) {
      const error: ApiErrorResponse = {
        message: err.response?.data?.message || err.message || 'Unknown error',
        errors: err.response?.data?.errors,
        status: err.response?.status,
      }
      setState({ data: null, loading: false, error })
      options?.onError?.(error)
      throw error
    }
  }, [apiCall, options])

  return { ...state, execute }
}

/**
 * Hook to fetch data on mount
 */
export function useFetch<T>(apiCall: () => Promise<any>, dependencies: any[] = []) {
  const { data, loading, error, execute } = useApi<T>(apiCall)

  // Auto-execute on mount
  useEffect(() => {
    execute()
  }, dependencies)

  return { data, loading, error, refetch: execute }
}

/**
 * Hook for POST/PUT/DELETE mutations
 */
export function useMutation<T>(
  apiCall: (payload?: any) => Promise<any>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: ApiErrorResponse) => void
  }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = useCallback(
    async (payload?: any) => {
      setState({ data: null, loading: true, error: null })
      try {
        const response = await apiCall(payload)
        const data = response.data as T
        setState({ data, loading: false, error: null })
        options?.onSuccess?.(data)
        return data
      } catch (err: any) {
        const error: ApiErrorResponse = {
          message: err.response?.data?.message || err.message || 'Unknown error',
          errors: err.response?.data?.errors,
          status: err.response?.status,
        }
        setState({ data: null, loading: false, error })
        options?.onError?.(error)
        throw error
      }
    },
    [apiCall, options]
  )

  return { ...state, mutate }
}
