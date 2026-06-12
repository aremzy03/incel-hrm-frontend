interface Column {
  key: string;
  label: string;
  mono?: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  header?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  rows,
  header,
  emptyMessage = "No records found.",
}: DataTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      {header ? (
        <div className="border-b border-outline-variant">{header}</div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-outline-variant bg-surface-container-low">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-xs font-bold tracking-wider text-on-surface-variant uppercase"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-sm text-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-3 align-middle text-sm ${col.mono ? "font-data-table text-data-table" : ""}`}
                    >
                      {row[col.key] ?? null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
