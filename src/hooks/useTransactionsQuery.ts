import { useEffect, useState } from 'react'
import { fetchTransactions } from '../api/mockApi'
import {
  buildQueryKey,
  getCachedResult,
  setCachedResult
} from '../api/queryCache'
import type { TxQueryParams, TxQueryResult } from '../types'

type FetchState = {
  key: string
  result: TxQueryResult
}

type QueryState = {
  data: TxQueryResult | undefined
  isLoading: boolean
  isFetching: boolean
}

// Server-state hook: the cache is read directly during render, so a cache
// hit (example: going back to a previous page) renders instantly with no
// effect round trip. On a miss, the previous result stays visible as
// `data` while `isFetching` flips on, so the table never unmounts or
// flashes blank between fetches.
export function useTransactionsQuery(params: TxQueryParams): QueryState {
  const key = buildQueryKey(params)
  const cached = getCachedResult(key)

  const [fetched, setFetched] = useState<FetchState | null>(null)

  useEffect(() => {
    if (getCachedResult(key)) return

    let cancelled = false

    fetchTransactions(params).then((result) => {
      if (cancelled) return
      setCachedResult(key, result)
      setFetched({ key, result })
    })

    return () => {
      cancelled = true
    }
    // params is derived from key, effect only needs to re-run when the key changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const freshData =
    cached ?? (fetched?.key === key ? fetched.result : undefined)
  const data = freshData ?? fetched?.result

  return {
    data,
    isLoading: data === undefined,
    isFetching: freshData === undefined
  }
}
