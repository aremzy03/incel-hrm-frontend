import type { BulkMembershipResponse } from "@/lib/types/auth";

export function BulkResultPanel({
  title = "Result",
  result,
  className,
}: {
  title?: string;
  result: BulkMembershipResponse | null;
  className?: string;
}) {
  if (!result) return null;

  return (
    <div className={className}>
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <p className="text-sm text-foreground">
          <span className="font-semibold">Succeeded:</span>{" "}
          {result.succeeded_user_ids.length}
          {result.failed.length > 0 ? (
            <>
              {" "}
              <span className="text-muted-foreground">•</span>{" "}
              <span className="font-semibold">Failed:</span> {result.failed.length}
            </>
          ) : null}
        </p>

        {result.failed.length > 0 && (
          <ul className="max-h-36 overflow-auto text-xs text-muted-foreground">
            {result.failed.map((f) => (
              <li key={f.user_id} className="py-1">
                <span className="font-semibold text-foreground">{f.code}</span>{" "}
                <span className="text-muted-foreground">({f.user_id}):</span>{" "}
                {f.error}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

