import { describe, expect, it } from 'vitest'
import { runQuery } from './queryEngine'
import type { TxQueryParams } from '../types'

const TEST_ROWS = 500

const baseParams: TxQueryParams = {
  page: 1,
  pageSize: 20,
  filters: {},
  sortField: 'timestamp',
  sortDirection: 'desc',
}

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
      TEST_ROWS,
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
})
