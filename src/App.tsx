import { useCallback } from 'react'
import { useTxQueryParams } from './hooks/useTxQueryParams'
import { useTransactionsQuery } from './hooks/useTransactionsQuery'
import { FiltersBar } from './components/FiltersBar'
import { SummaryPanel } from './components/SummaryPanel'
import { TransactionTable } from './components/TransactionTable'
import { Pagination } from './components/Pagination'
import type { SortField, TxFilters } from './types'

function App() {
  const [params, dispatch] = useTxQueryParams()
  const { data, isLoading, isFetching } = useTransactionsQuery(params)

  const handleFilterChange = useCallback(
    (patch: Partial<TxFilters>) => dispatch({ type: 'setFilters', filters: patch }),
    [dispatch]
  )

  const handleSortChange = useCallback(
    (sortField: SortField) => dispatch({ type: 'setSort', sortField }),
    [dispatch]
  )

  const handlePageChange = useCallback((page: number) => dispatch({ type: 'setPage', page }), [dispatch])

  const handlePageSizeChange = useCallback(
    (pageSize: number) => dispatch({ type: 'setPageSize', pageSize }),
    [dispatch]
  )

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-semibold">Crypto Transaction Explorer</h1>
      </header>

      <FiltersBar filters={params.filters} onFilterChange={handleFilterChange} />

      <SummaryPanel summary={data?.summary} />

      {isLoading ? (
        <p className="p-6 text-sm text-slate-500">Loading transactions...</p>
      ) : (
        <>
          <TransactionTable
            rows={data?.rows ?? []}
            sortField={params.sortField}
            sortDirection={params.sortDirection}
            onSortChange={handleSortChange}
            isFetching={isFetching}
          />
          <Pagination
            page={params.page}
            pageSize={params.pageSize}
            total={data?.total ?? 0}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  )
}

export default App
