import { beforeEach, describe, expect, it } from 'vitest'
import { clearResolvedQueryCache, runQuery } from './queryEngine'
import type { TxQueryParams } from '../types'

const TEST_ROWS = 500

const baseParams: TxQueryParams = {
  page: 1,
  pageSize: 20,
  filters: {},
  sortField: 'timestamp',
  sortDirection: 'desc'
}

beforeEach(() => {
  clearResolvedQueryCache()
})

describe('runQuery', () => {
  it('paginates results', () => {
    const result = runQuery(baseParams, TEST_ROWS)
    expect(result.rows).toHaveLength(20)
    expect(result.total).toBe(TEST_ROWS)
  })

  it('filters by chain', () => {
    const result = runQuery({ ...baseParams, filters: { chain: 'solana' } }, TEST_ROWS)
    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rows.every((row) => row.chain === 'solana')).toBe(true)
  })

  it('sorts by amountUsd descending', () => {
    const result = runQuery(
      { ...baseParams, pageSize: TEST_ROWS, sortField: 'amountUsd', sortDirection: 'desc' },
      TEST_ROWS
    )
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i - 1].amountUsd).toBeGreaterThanOrEqual(result.rows[i].amountUsd)
    }
  })

  it('summary reflects all matching rows, not just the current page', () => {
    const fullPage = runQuery({ ...baseParams, pageSize: TEST_ROWS }, TEST_ROWS)
    const firstPage = runQuery({ ...baseParams, pageSize: 10 }, TEST_ROWS)
    expect(firstPage.summary).toEqual(fullPage.summary)
  })

  it('is deterministic across repeated calls', () => {
    const a = runQuery(baseParams, TEST_ROWS)
    const b = runQuery(baseParams, TEST_ROWS)
    expect(a).toEqual(b)
  })

  it('pages stay consistent with the full result when served from the resolved-query cache', () => {
    const pageSize = 30
    const full = runQuery({ ...baseParams, pageSize: TEST_ROWS }, TEST_ROWS)

    const collected = []
    for (let page = 1; page <= Math.ceil(TEST_ROWS / pageSize); page++) {
      const result = runQuery({ ...baseParams, page, pageSize }, TEST_ROWS)
      expect(result.summary).toEqual(full.summary)
      collected.push(...result.rows)
    }

    expect(collected).toEqual(full.rows)
  })

  it('does not mix results across different totalRows for the same filters', () => {
    const small = runQuery({ ...baseParams, pageSize: TEST_ROWS }, 200)
    const large = runQuery({ ...baseParams, pageSize: TEST_ROWS }, TEST_ROWS)
    expect(small.total).toBe(200)
    expect(large.total).toBe(TEST_ROWS)
  })
})
