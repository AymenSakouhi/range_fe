import { beforeEach, describe, expect, it } from 'vitest'
import { buildQueryKey, clearCache, getCachedResult, setCachedResult } from './queryCache'
import type { TxQueryParams, TxQueryResult } from '../types'

const baseParams: TxQueryParams = {
  page: 1,
  pageSize: 50,
  filters: {},
  sortField: 'timestamp',
  sortDirection: 'desc',
}

const emptyResult: TxQueryResult = {
  rows: [],
  total: 0,
  summary: {
    totalResults: 0,
    totalVolumeUsd: 0,
    countByChain: { ethereum: 0, solana: 0, osmosis: 0, base: 0 },
    failedRate: 0,
  },
}

beforeEach(() => {
  clearCache()
})

describe('buildQueryKey', () => {
  it('is stable for the same logical params', () => {
    const a = buildQueryKey({ ...baseParams, filters: { chain: 'solana' } })
    const b = buildQueryKey({ ...baseParams, filters: { chain: 'solana' } })
    expect(a).toBe(b)
  })

  it('differs when a filter value differs', () => {
    const a = buildQueryKey({ ...baseParams, filters: { chain: 'solana' } })
    const b = buildQueryKey({ ...baseParams, filters: { chain: 'base' } })
    expect(a).not.toBe(b)
  })

  it('differs when the page differs', () => {
    const a = buildQueryKey({ ...baseParams, page: 1 })
    const b = buildQueryKey({ ...baseParams, page: 2 })
    expect(a).not.toBe(b)
  })
})

describe('query cache', () => {
  it('returns undefined for a miss and the stored value for a hit', () => {
    const key = buildQueryKey(baseParams)
    expect(getCachedResult(key)).toBeUndefined()

    setCachedResult(key, emptyResult)
    expect(getCachedResult(key)).toBe(emptyResult)
  })
})
