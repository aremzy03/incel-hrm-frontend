import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  accent?: "default" | "warning";
  href?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  delta,
  deltaTone = "neutral",
  accent = "default",
  href,
}: StatCardProps) {
  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <span
          className={cn(
            "shrink-0 [&_svg]:size-5",
            accent === "warning" ? "text-amber-500" : "text-primary"
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-1">
        <p className="text-headline-lg font-bold text-on-surface tabular-nums">{value}</p>
        {trend ? (
          <p className="text-body-md font-medium text-on-surface-variant">{trend}</p>
        ) : null}
        {delta ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-label-md font-medium tabular-nums",
              deltaTone === "positive" && "bg-green-100 text-green-700",
              deltaTone === "negative" && "bg-red-100 text-red-700",
              deltaTone === "neutral" && "bg-surface-container-high text-on-surface-variant"
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "group relative block overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-4 custom-shadow transition-colors",
    href
      ? "hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
      : "hover:border-primary/30",
    accent === "warning" && "hover:border-amber-500/30"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
