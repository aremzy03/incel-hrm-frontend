import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const canPrev = clampedPage > 1;
  const canNext = clampedPage < totalPages;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-xs text-muted-foreground">
        Page <span className="font-semibold text-foreground">{clampedPage}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          title="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted disabled:opacity-60"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={!canNext}
          aria-label="Next page"
          title="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted disabled:opacity-60"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

