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
  if (filters.minUsd !== undefined && row.amountUsd < filters.minUsd) return false

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

type ResolvedQuery = {
  matches: TxEvent[]
  summary: TxSummary
}

// More Infos for me to explain - no issue to leave this comment for the interviewer as well:
// - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// This runs inside the worker (see worker.ts), off the main thread. Filtering,
// aggregating and sorting is the expensive O(totalRows) part. It depends only
// on filters + sort, not on page, so a page-only change (Next/Prev) should
// never repeat it. Keyed separately from pagination and capped small since
// each entry can hold up to the full matching set.
const MAX_RESOLVED_ENTRIES = 5
const resolvedCache = new Map<string, ResolvedQuery>()

function buildResolvedKey(
  filters: TxFilters,
  sortField: TxQueryParams['sortField'],
  sortDirection: TxQueryParams['sortDirection'],
  totalRows: number
): string {
  const { chain = '', token = '', status = '', minUsd = '', search = '' } = filters
  return [totalRows, sortField, sortDirection, chain, token, status, minUsd, search].join('|')
}

function resolveQuery(
  filters: TxFilters,
  sortField: TxQueryParams['sortField'],
  sortDirection: TxQueryParams['sortDirection'],
  totalRows: number
): ResolvedQuery {
  const key = buildResolvedKey(filters, sortField, sortDirection, totalRows)
  const cached = resolvedCache.get(key)
  if (cached) return cached

  const matches: TxEvent[] = []
  const countByChain: Record<Chain, number> = { ...EMPTY_CHAIN_COUNTS }
  let totalVolumeUsd = 0
  let failedCount = 0

  for (let i = 0; i < totalRows; i++) {
    const row = generateRow(i)
    if (!matchesFilters(row, filters)) continue

    matches.push(row)
    countByChain[row.chain] += 1
    totalVolumeUsd += row.amountUsd
    if (row.status === 'failed') failedCount += 1
  }

  matches.sort((a, b) => compareRows(a, b, sortField, sortDirection))

  const summary: TxSummary = {
    totalResults: matches.length,
    totalVolumeUsd: Math.round(totalVolumeUsd * 100) / 100,
    countByChain,
    failedRate: matches.length === 0 ? 0 : failedCount / matches.length
  }

  const resolved: ResolvedQuery = { matches, summary }

  if (!resolvedCache.has(key) && resolvedCache.size >= MAX_RESOLVED_ENTRIES) {
    const oldestKey = resolvedCache.keys().next().value
    if (oldestKey !== undefined) resolvedCache.delete(oldestKey)
  }
  resolvedCache.set(key, resolved)

  return resolved
}

export function clearResolvedQueryCache(): void {
  resolvedCache.clear()
}

export function runQuery(params: TxQueryParams, totalRows: number = DEFAULT_TOTAL_ROWS): TxQueryResult {
  const { matches, summary } = resolveQuery(params.filters, params.sortField, params.sortDirection, totalRows)

  const start = (params.page - 1) * params.pageSize
  const rows = matches.slice(start, start + params.pageSize)

  return { rows, total: matches.length, summary }
}
