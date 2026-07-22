import { useReducer } from 'react'
import type { SortDirection, SortField, TxFilters, TxQueryParams } from '../types'

const DEFAULT_PAGE_SIZE = 50

const initialParams: TxQueryParams = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  filters: {},
  sortField: 'timestamp',
  sortDirection: 'desc'
}

export type TxQueryAction =
  | { type: 'setFilters'; filters: Partial<TxFilters> }
  | { type: 'setSort'; sortField: SortField }
  | { type: 'setPage'; page: number }
  | { type: 'setPageSize'; pageSize: number }

// Filter/sort/page-size changes all reset page to 1, matching the assignment's
// requirement that changing what's being asked for starts back at the top.
function reducer(state: TxQueryParams, action: TxQueryAction): TxQueryParams {
  switch (action.type) {
    case 'setFilters':
      return { ...state, filters: { ...state.filters, ...action.filters }, page: 1 }
    case 'setSort': {
      const sortDirection: SortDirection =
        state.sortField === action.sortField && state.sortDirection === 'desc' ? 'asc' : 'desc'
      return { ...state, sortField: action.sortField, sortDirection, page: 1 }
    }
    case 'setPage':
      return { ...state, page: action.page }
    case 'setPageSize':
      return { ...state, pageSize: action.pageSize, page: 1 }
  }
}

export function useTxQueryParams() {
  return useReducer(reducer, initialParams)
}
