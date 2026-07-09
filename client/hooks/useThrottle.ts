import { useRef, useCallback } from 'react'

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T, limit: number = 500
): T {
  const lastCall = useRef(0)
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall.current >= limit) {
      lastCall.current = now
      return fn(...args)
    }
  }, [fn, limit]) as T
}
