import type { TxQueryParams, TxQueryResult } from '../types'

const MAX_CACHE_ENTRIES = 100

const cache = new Map<string, TxQueryResult>()

// Builds a stable string key from the fields that actually affect the
// result, so identical queries hit the cache regardless of object identity
// or key order in the filters object.
export function buildQueryKey(params: TxQueryParams): string {
  const { page, pageSize, filters, sortField, sortDirection } = params
  const {
    chain = '',
    token = '',
    status = '',
    minUsd = '',
    search = ''
  } = filters
  return [
    page,
    pageSize,
    sortField,
    sortDirection,
    chain,
    token,
    status,
    minUsd,
    search
  ].join('|')
}

export function getCachedResult(key: string): TxQueryResult | undefined {
  return cache.get(key)
}

export function setCachedResult(key: string, result: TxQueryResult): void {
  if (!cache.has(key) && cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }
  cache.set(key, result)
}

export function clearCache(): void {
  cache.clear()
}
