type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex items-center justify-between gap-4 p-4 text-sm text-slate-600">
      <label className="flex items-center gap-2">
        Rows per page
        <select
          className="rounded border border-slate-300 px-2 py-1"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
