import { useMemo } from 'react'
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'

export default function PaginationBar({ pagination, onPageChange, onLimitChange, itemLabel = 'items' }) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))
  const page = pagination.page
  const from = pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1
  const to = Math.min(pagination.total, page * pagination.limit)

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    let end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    const arr = []
    for (let p = start; p <= end; p++) arr.push(p)
    return arr
  }, [page, totalPages])

  return (
    <div className="card !py-3 !px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium text-gray-800">{from}</span>–
        <span className="font-medium text-gray-800">{to}</span> of{' '}
        <span className="font-medium text-gray-800">{pagination.total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-3">
        <select
          value={pagination.limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="input-field !py-1.5 !px-2 text-sm w-auto"
          aria-label={`${itemLabel} per page`}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="btn-secondary !px-2 !py-1.5 text-sm"
            title="First page"
            aria-label="First page"
          >
            <FiChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="btn-secondary !px-3 !py-1.5 text-sm"
          >
            Prev
          </button>

          {pageNumbers[0] > 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <span className="px-1 text-gray-400 text-sm">…</span>
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary !px-3 !py-1.5 text-sm"
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="btn-secondary !px-2 !py-1.5 text-sm"
            title="Last page"
            aria-label="Last page"
          >
            <FiChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
