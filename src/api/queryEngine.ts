import { generateRow } from './dataGenerator'
import type {
  Chain,
  TxEvent,
  TxFilters,
  TxQueryParams,
  TxQueryResult,
  TxSummary
} from '../types'

export const DEFAULT_TOTAL_ROWS = 150_000

const EMPTY_CHAIN_COUNTS: Record<Chain, number> = {
  ethereum: 0,
  solana: 0,
  osmosis: 0,
  base: 0
}

function matchesFilters(row: TxEvent, filters: TxFilters): boolean {
  if (filters.chain && row.chain !== filters.chain) return false
  if (filters.token && row.token !== filters.token) return false
  if (filters.status && row.status !== filters.status) return false
  if (filters.minUsd !== undefined && row.amountUsd < filters.minUsd)
    return false

  if (filters.search) {
    const term = filters.search.toLowerCase()
    const senderMatch = row.sender.toLowerCase().includes(term)
    const receiverMatch = row.receiver.toLowerCase().includes(term)
    if (!senderMatch && !receiverMatch) return false
  }

  return true
}

function compareRows(
  a: TxEvent,
  b: TxEvent,
  field: TxQueryParams['sortField'],
  direction: TxQueryParams['sortDirection']
): number {
  const diff = a[field] - b[field]
  return direction === 'asc' ? diff : -diff
}

// More Infos for me to explain - no issue to leave this comment for the interviewer as well:
// - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// a plain synchronous function with no React/worker dependency. It scans the virtual dataset once,
// applying filters while accumulating the aggregate stats (volume, count by chain, failed count) in the same pass,
// then sorts matches and slices out the requested page.
export function runQuery(
  params: TxQueryParams,
  totalRows: number = DEFAULT_TOTAL_ROWS
): TxQueryResult {
  const matches: TxEvent[] = []
  const countByChain: Record<Chain, number> = { ...EMPTY_CHAIN_COUNTS }
  let totalVolumeUsd = 0
  let failedCount = 0

  for (let i = 0; i < totalRows; i++) {
    const row = generateRow(i)
    if (!matchesFilters(row, params.filters)) continue

    matches.push(row)
    countByChain[row.chain] += 1
    totalVolumeUsd += row.amountUsd
    if (row.status === 'failed') failedCount += 1
  }

  matches.sort((a, b) =>
    compareRows(a, b, params.sortField, params.sortDirection)
  )

  const start = (params.page - 1) * params.pageSize
  const rows = matches.slice(start, start + params.pageSize)

  const summary: TxSummary = {
    totalResults: matches.length,
    totalVolumeUsd: Math.round(totalVolumeUsd * 100) / 100,
    countByChain,
    failedRate: matches.length === 0 ? 0 : failedCount / matches.length
  }

  return { rows, total: matches.length, summary }
}
