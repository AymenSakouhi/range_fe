export type Chain = 'ethereum' | 'solana' | 'osmosis' | 'base'
export type TxStatus = 'pending' | 'confirmed' | 'failed'

export type TxEvent = {
  id: string
  timestamp: number
  chain: Chain
  token: string
  amountUsd: number
  sender: string
  receiver: string
  status: TxStatus
}

export type SortField = 'timestamp' | 'amountUsd'
export type SortDirection = 'asc' | 'desc'

export type TxFilters = {
  chain?: Chain
  token?: string
  status?: TxStatus
  minUsd?: number
  search?: string
}

export type TxQueryParams = {
  page: number
  pageSize: number
  filters: TxFilters
  sortField: SortField
  sortDirection: SortDirection
}

export type TxSummary = {
  totalResults: number
  totalVolumeUsd: number
  countByChain: Record<Chain, number>
  failedRate: number
}

export type TxQueryResult = {
  rows: TxEvent[]
  total: number
  summary: TxSummary
}
