import { TransactionRow } from './TransactionRow'
import type { SortDirection, SortField, TxEvent } from '../types'

type Props = {
  rows: TxEvent[]
  sortField: SortField
  sortDirection: SortDirection
  onSortChange: (field: SortField) => void
  isFetching: boolean
}

function sortIndicator(active: boolean, direction: SortDirection) {
  if (!active) return null
  return direction === 'asc' ? ' ↑' : ' ↓'
}

export function TransactionTable({ rows, sortField, sortDirection, onSortChange, isFetching }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="px-3 py-2">
              <button type="button" onClick={() => onSortChange('timestamp')} className="font-semibold">
                Time{sortIndicator(sortField === 'timestamp', sortDirection)}
              </button>
            </th>
            <th className="px-3 py-2">Chain</th>
            <th className="px-3 py-2">Token</th>
            <th className="px-3 py-2 text-right">
              <button type="button" onClick={() => onSortChange('amountUsd')} className="font-semibold">
                Amount{sortIndicator(sortField === 'amountUsd', sortDirection)}
              </button>
            </th>
            <th className="px-3 py-2">Sender</th>
            <th className="px-3 py-2">Receiver</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className={isFetching ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          {rows.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-6 text-center text-sm text-slate-500">No transactions match these filters.</p>
      )}
    </div>
  )
}
