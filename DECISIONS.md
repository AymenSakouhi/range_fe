# Decisions

## Deviating from the `fetchTransactions` signature

The brief's pseudocode shows `fetchTransactions(params): Promise<TxEvent[]>` - a bare array. The
actual implementation returns `Promise<{ rows: TxEvent[]; total: number; summary: TxSummary }>`
instead. This is deliberate: the summary panel is required to reflect all matching results, not
just the current page, and there's no way to derive a correct global total/volume/failure-rate
from a page-sized array alone without either shipping every matching row to the client (defeats
pagination) or making a second round trip per interaction. Returning the aggregate alongside the
page in one response lets both be computed in a single scan. The pseudocode signature reads as
illustrative of the shape (rows in, rows out), not a literal contract to preserve once
aggregation enters the picture.

## Hardest performance issue

Making the "twist" (the summary panel must reflect all matching results, not just the current
page) both correct and cheap. The easy version is correct but wasteful: rescan and re-aggregate
all 150,000 rows on every interaction, including page turns where nothing relevant changed. The
harder version needed two cache tiers instead of one: an outer tier for the exact requested page
result (fast repeat visits to a specific page), and an inner tier scoped to filters + sort only
(fast page turns within an unchanged filter context, since the expensive scan doesn't need to
repeat just because the page number changed). Getting the cache keys right, so a page change hits
the inner tier without also having to match on page or pageSize, took a couple of iterations.

## Something that didn't work initially

Two things, both worth knowing about:

1. The first version of the server-state hook mutated a ref during render to track "the latest
   query key," and called `setState` synchronously inside an effect body for the cache-hit
   branch. Both are flagged by the newer `react-hooks` / React Compiler lint rules bundled in
   this project's ESLint config (`react-hooks/refs`, `react-hooks/set-state-in-effect`). Fixed by
   reading the cache directly during render (a plain synchronous read, not a ref) and only
   calling `setState` from inside the async fetch's `.then` callback.
2. While wiring the UI together, the app appeared to load with a stray chain/token filter already
   applied - the table showed only one chain's rows despite nothing being touched. It looked like
   a real bug at first. It turned out to be Chrome restoring a `<select>` element's value from
   browser navigation history across repeated same-URL reloads within one browser tab, which
   fired a genuine `change` event into the controlled component. A fresh tab loaded with the
   correct empty filters every time. It's worth knowing this exists, since it can look identical
   to an actual state bug.

## What would break at 1M rows

The scan approach (`generateRow(i)` for `i` in `0..totalRows`) is O(totalRows) per distinct
filter+sort combination, not O(pageSize). At 150k rows that costs ~400-500ms; at 1M rows it scales
roughly linearly, so the first scan for a new filter combination could take several seconds -
well past what feels responsive, even with the worker keeping the main thread free. The
resolved-query cache would also become a real memory concern: an unfiltered query at 1M rows would
hold a million row objects in a single cache entry, and even five cached entries could add up to
meaningful memory pressure in the browser tab. At that scale the mock API would need to move from
"generate and linearly scan a virtual range" to genuine indexed or pre-aggregated storage (sorted
indexes per sort field, precomputed rollups per filter dimension) - closer to what a real backend
with a database would actually do.

## Where memoization would not help

Memoization only pays off when the same inputs recur. The very first scan for any new filter/sort
combination has no prior result to reuse - `React.memo`, `useMemo`, and the resolved-query cache
can't do anything for a query nobody has made yet, since the underlying work still has to happen
once. It also wouldn't help the free-text search if every keystroke produced a genuinely distinct
query string; that's why search is debounced rather than memoized - deduplicating identical
repeat queries doesn't help when nearly every query is unique.

## How the mock API design impacts frontend performance

Because there's no real backend, filtering, sorting and aggregation all happen in JavaScript in
the browser (moved into a Web Worker so it doesn't block the UI thread). That means the frontend
directly owns a cost a real backend would normally absorb via a database with indexes: a full
scan per distinct query. The two-tier caching design exists specifically to compensate for that -
it's standing in for what a real backend's query planner and database indexes would otherwise
provide for free.
