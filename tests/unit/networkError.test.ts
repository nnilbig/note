import { afterEach, describe, expect, it, vi } from 'vitest'
import { friendlyErrorMessage, isNetworkError, isOnline } from '~/utils/networkError'

function withOnlineStatus(online: boolean, fn: () => void) {
  const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  try {
    fn()
  } finally {
    spy.mockRestore()
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isOnline', () => {
  it('reflects navigator.onLine', () => {
    withOnlineStatus(true, () => expect(isOnline()).toBe(true))
    withOnlineStatus(false, () => expect(isOnline()).toBe(false))
  })
})

describe('isNetworkError', () => {
  it('returns false for a null/undefined error', () => {
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
  })

  it('treats any error as a network error when navigator is offline', () => {
    withOnlineStatus(false, () => {
      expect(isNetworkError({ code: '23505', message: 'duplicate key' })).toBe(true)
    })
  })

  it('treats a TypeError as a network error', () => {
    withOnlineStatus(true, () => {
      expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    })
  })

  it('treats a message mentioning fetch/network as a network error', () => {
    withOnlineStatus(true, () => {
      expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource' })).toBe(true)
    })
  })

  it('does not treat a real PostgREST/RLS error as a network error', () => {
    withOnlineStatus(true, () => {
      expect(isNetworkError({ code: '42501', message: 'new row violates row-level security policy' })).toBe(false)
    })
  })
})

describe('friendlyErrorMessage', () => {
  it('returns the offline message for a network error', () => {
    withOnlineStatus(false, () => {
      expect(friendlyErrorMessage({ message: 'anything' }, 'fallback')).toBe('目前離線，此操作需要網路連線')
    })
  })

  it('returns the original error message for a non-network error', () => {
    withOnlineStatus(true, () => {
      expect(friendlyErrorMessage({ code: '42501', message: 'RLS violation' }, 'fallback')).toBe('RLS violation')
    })
  })

  it('falls back when the error has no message', () => {
    withOnlineStatus(true, () => {
      expect(friendlyErrorMessage({ code: '42501' }, 'fallback')).toBe('fallback')
    })
  })
})
