interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  /** Optional card header slot rendered above the table inside the same card */
  header?: React.ReactNode;
  /** Message shown when rows is empty */
  emptyMessage?: string;
}

export function DataTable({
  columns,
  rows,
  header,
  emptyMessage = "No records found.",
}: DataTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
      {header && (
        <div className="border-b border-border/80">{header}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-semibold tracking-normal text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-border/80 text-foreground transition-colors duration-200 hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 align-middle">
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
