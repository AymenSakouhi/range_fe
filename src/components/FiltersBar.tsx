import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { ALL_TOKENS, CHAINS, STATUSES } from '../api/dataGenerator'
import type { TxFilters } from '../types'

const SEARCH_DEBOUNCE_MS = 300

type Props = {
  filters: TxFilters
  onFilterChange: (patch: Partial<TxFilters>) => void
}

// Search stays local state so typing is never blocked by a fetch. Only the
// debounced value is pushed up into the committed query, so keystrokes don't
// each trigger their own request.
export function FiltersBar({ filters, onFilterChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? '')) {
      onFilterChange({ search: debouncedSearch || undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 p-4">
      <label className="flex flex-col text-sm text-slate-600">
        Chain
        <select
          className="mt-1 rounded border border-slate-300 px-2 py-1"
          value={filters.chain ?? ''}
          onChange={(event) =>
            onFilterChange({ chain: (event.target.value || undefined) as TxFilters['chain'] })
          }
        >
          <option value="">All</option>
          {CHAINS.map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm text-slate-600">
        Token
        <select
          className="mt-1 rounded border border-slate-300 px-2 py-1"
          value={filters.token ?? ''}
          onChange={(event) => onFilterChange({ token: event.target.value || undefined })}
        >
          <option value="">All</option>
          {ALL_TOKENS.map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm text-slate-600">
        Status
        <select
          className="mt-1 rounded border border-slate-300 px-2 py-1"
          value={filters.status ?? ''}
          onChange={(event) =>
            onFilterChange({ status: (event.target.value || undefined) as TxFilters['status'] })
          }
        >
          <option value="">All</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm text-slate-600">
        Min USD
        <input
          type="number"
          min={0}
          className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
          value={filters.minUsd ?? ''}
          onChange={(event) => {
            const value = event.target.value
            onFilterChange({ minUsd: value === '' ? undefined : Number(value) })
          }}
        />
      </label>

      <label className="flex flex-col text-sm text-slate-600">
        Sender / receiver
        <input
          type="text"
          placeholder="search address"
          className="mt-1 w-56 rounded border border-slate-300 px-2 py-1"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </label>
    </div>
  )
}
