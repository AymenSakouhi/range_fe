/// <reference lib="webworker" />

import { runQuery } from './queryEngine'
import type { TxQueryParams, TxQueryResult } from '../types'

export type WorkerRequest = {
  requestId: number
  params: TxQueryParams
  totalRows?: number
}

export type WorkerResponse = {
  requestId: number
  result: TxQueryResult
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, params, totalRows } = event.data
  const result = runQuery(params, totalRows)
  const response: WorkerResponse = { requestId, result }
  self.postMessage(response)
}
