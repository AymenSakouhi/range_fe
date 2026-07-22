# Crypto Transaction Explorer

A paginated transaction table backed by a simulated API. There is no real backend,
`fetchTransactions` generates deterministic mock data on demand, applies filters,
sorting and pagination, and returns results with a simulated network delay.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS

## Getting started

```
npm install
npm run dev
```

Other scripts:

```
npm run build     # type-check and build for production
npm run lint      # run eslint
npm run preview   # preview the production build
```

## Project structure

- `src/types.ts` - shared types (`TxEvent`, filters, query params, results)
- `src/api` - mock API, data generator and query engine
- `src/hooks` - state and data-fetching hooks
- `src/components` - UI components

## Docs

- `PERFORMANCE.md` - bottlenecks found, optimizations made, how they were verified
- `DECISIONS.md` - notes on the harder tradeoffs
