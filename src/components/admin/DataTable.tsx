import type { ReactNode } from 'react'
import { EmptyState, LoadingState } from '../ui/Status'

export type Column<T> = { key: string; label: string; render: (row: T) => ReactNode; sortValue?: (row: T) => string | number }
export function DataTable<T>({ rows, columns, rowKey, loading = false, emptyTitle = 'No records found', emptyDescription = 'There is nothing to show for the current filters.' }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; loading?: boolean; emptyTitle?: string; emptyDescription?: string }) {
  if (loading) return <LoadingState label="Loading records…" />
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription}/>
  return <div className="table-wrap"><table><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key} data-label={column.label}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
}
