import { memo } from 'react'
import type { TxSummary } from '../types'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

type Props = {
  summary: TxSummary | undefined
}

function SummaryPanelImpl({ summary }: Props) {
  if (!summary) return null

  const chainCounts = Object.entries(summary.countByChain)

  return (
    <div className="grid grid-cols-2 gap-4 border-b border-slate-200 p-4 sm:grid-cols-4">
      <div>
        <p className="text-xs uppercase text-slate-500">Total results</p>
        <p className="text-lg font-semibold">{summary.totalResults.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">Total volume</p>
        <p className="text-lg font-semibold">{usdFormatter.format(summary.totalVolumeUsd)}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">Failed rate</p>
        <p className="text-lg font-semibold">{percentFormatter.format(summary.failedRate)}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">By chain</p>
        <p className="text-sm">
          {chainCounts.map(([chain, count]) => `${chain}: ${count.toLocaleString()}`).join(' · ')}
        </p>
      </div>
    </div>
  )
}

// Memoized: when the query cache returns the same result object (e.g. going
// back to a page already seen), the summary object reference is unchanged,
// so this skips re-rendering entirely instead of recomputing its layout.
export const SummaryPanel = memo(SummaryPanelImpl)
