import Link from "next/link";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  mono?: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  header?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  getRowHref?: (rowIndex: number) => string | undefined;
  getRowLabel?: (rowIndex: number) => string | undefined;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  header,
  emptyMessage = "No records found.",
  getRowHref,
  getRowLabel,
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest custom-shadow",
        className
      )}
    >
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
                  className="px-6 py-3 text-label-md font-bold tracking-wider text-on-surface-variant uppercase"
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
                  className="px-6 py-10 text-center text-body-md text-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const href = getRowHref?.(i);
                return (
                  <tr
                    key={i}
                    className={cn(
                      "text-on-surface transition-colors hover:bg-surface-container-low",
                      href && "relative"
                    )}
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-6 py-3.5 align-middle text-body-md",
                          col.mono && "font-data-table text-data-table tabular-nums"
                        )}
                      >
                        {href && colIndex === 0 ? (
                          <Link
                            href={href}
                            aria-label={getRowLabel?.(i) ?? "View details"}
                            className="after:absolute after:inset-0 after:z-[1] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                          >
                            {row[col.key] ?? null}
                          </Link>
                        ) : (
                          (row[col.key] ?? null)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
