# Performance

## Bottlenecks encountered

1. Generating and scanning the full virtual dataset (150,000 rows) is the real cost, not React
   rendering. Measured directly: a full unfiltered scan (generate every row, filter, sort,
   aggregate) takes roughly 400-500ms, which is comparable to or exceeds the simulated 200-500ms
   network delay by itself.
2. A naive implementation repeats that full scan on every page turn (Next/Prev), even when
   filters and sort haven't changed. Clicking through pages of the same result set was as slow
   as the very first load, every time.
3. Typing in the sender/receiver search field fires a new query per keystroke without
   debouncing, so the 150k-row scan would run on every character typed.
4. This project's ESLint config bundles the newer `react-hooks` rules (the React Compiler
   ruleset), which reject synchronous `setState` inside an effect body and mutating a ref during
   render. A first pass at the server-state hook used both patterns and had to be rewritten.

## What was optimized

1. **Debounced search** (300ms) - typing updates local UI state immediately; the committed query
   only changes after the user pauses.
2. **Web Worker for the scan** - filtering, sorting and aggregating 150,000 rows runs off the
   main thread, so typing, sort clicks and filter changes never block rendering.
3. **Query-result cache** on the main thread, keyed by the full query (filters + sort + page +
   pageSize). Revisiting an exact page/filter combination is instant - no worker round trip, no
   simulated delay.
4. **Resolved-query cache inside the worker**, keyed by filters + sort only, not page. The
   expensive filter/sort/aggregate scan runs once per distinct filter+sort combination;
   subsequent page turns within that combination slice an already-computed array instead of
   rescanning.
5. **Summary computed in the same single pass** as filtering/sorting, not a second pass and not
   recomputed on the client. Because it's cached alongside the resolved query, a page-only change
   reuses it directly instead of recalculating.
6. **Memoized rows** - `TransactionRow` wrapped in `React.memo`, action handlers memoized with
   `useCallback` off a stable `dispatch` from `useReducer`, so table rows don't re-render for
   unrelated state changes.
7. **No blank/flicker state** - the previous page's data stays visible (dimmed) while a new page
   loads, instead of unmounting the table or showing a spinner in its place.

## How improvements were verified

- Direct timing in a throwaway Vitest test: first unfiltered scan of 150,000 rows took ~416ms; a
  subsequent page turn served from the resolved-query cache took ~0.02ms, a roughly 20,000x
  difference for the same filters/sort. The test was removed after capturing the numbers since
  it measures timing, not correctness.
- Manual verification in a real browser via Playwright, not just type-checking: confirmed the
  worker actually ships as its own chunk in the production build (`worker-*.js`), confirmed no
  console errors across filter/sort/pagination/search interactions, and confirmed the summary
  panel reflects the full filtered set (not the current page) when a filter changes - e.g.
  filtering to one chain dropped total results from 150,000 to the correct ~37,500 and the volume
  and failed-rate figures updated to match.
- Automated tests specifically protect the resolved-query cache's correctness: paginating
  through an entire filtered result set page-by-page and concatenating the pages produces the
  exact same array as requesting everything in one page, and the cache doesn't leak results
  across different dataset sizes for the same filter key.

## Tradeoffs

- Both caches (the main-thread query-result cache and the worker's resolved-query cache) are
  capped small (100 and 5 entries) with simple oldest-first eviction rather than true LRU. That's
  enough for a session's worth of interactive use, not built to scale to unbounded query variety.
- The resolved-query cache trades memory for speed: an unfiltered query caches up to 150,000 row
  objects. Capping it at 5 entries bounds the worst case to roughly 750,000 cached row
  references - fine for this scale, would need a smarter eviction policy (or a lower cap) if the
  variety of distinct filter combinations grew much larger.
- The simulated 200-500ms network delay still applies on every genuinely new request (first
  visit to a page, first use of a filter combination), by design - it only disappears for exact
  repeats and for page turns within an already-resolved filter/sort context. The goal was to
  remove wasted recomputation, not to fake away the latency the assignment asks to simulate.
