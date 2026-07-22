import { DEFAULT_TOTAL_ROWS } from './queryEngine'
import type { TxQueryParams, TxQueryResult } from '../types'
import type { WorkerRequest, WorkerResponse } from './worker'

const MIN_DELAY_MS = 200
const MAX_DELAY_MS = 500

let worker: Worker | null = null
let nextRequestId = 0
const pending = new Map<number, (result: TxQueryResult) => void>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { requestId, result } = event.data
      const resolve = pending.get(requestId)
      if (!resolve) return
      pending.delete(requestId)
      resolve(result)
    }
  }
  return worker
}

function runInWorker(params: TxQueryParams): Promise<TxQueryResult> {
  const requestId = nextRequestId++
  return new Promise((resolve) => {
    pending.set(requestId, resolve)
    const request: WorkerRequest = { requestId, params, totalRows: DEFAULT_TOTAL_ROWS }
    getWorker().postMessage(request)
  })
}

function simulatedDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Simulates the network layer: the query itself runs off the main thread in
// a worker, a randomized 200-500ms delay stands in for real network latency.
export async function fetchTransactions(params: TxQueryParams): Promise<TxQueryResult> {
  const [result] = await Promise.all([runInWorker(params), simulatedDelay()])
  return result
}
