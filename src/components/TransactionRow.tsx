import { memo } from 'react'
import type { TxEvent } from '../types'

const STATUS_STYLES: Record<TxEvent['status'], string> = {
  confirmed: 'text-emerald-700 bg-emerald-50',
  pending: 'text-amber-700 bg-amber-50',
  failed: 'text-rose-700 bg-rose-50'
}

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

function TransactionRowImpl({ tx }: { tx: TxEvent }) {
  return (
    <tr className="border-b border-slate-100 text-sm">
      <td className="whitespace-nowrap px-3 py-2">{timeFormatter.format(tx.timestamp)}</td>
      <td className="px-3 py-2 capitalize">{tx.chain}</td>
      <td className="px-3 py-2">{tx.token}</td>
      <td className="px-3 py-2 text-right">{usdFormatter.format(tx.amountUsd)}</td>
      <td className="px-3 py-2 font-mono text-xs">{tx.sender}</td>
      <td className="px-3 py-2 font-mono text-xs">{tx.receiver}</td>
      <td className="px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[tx.status]}`}>{tx.status}</span>
      </td>
    </tr>
  )
}

export const TransactionRow = memo(TransactionRowImpl)
