import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  /** Secondary line below the value (e.g. “days remaining”). */
  trend?: string;
  /** Optional change badge (e.g. “+12%”). */
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  delta,
  deltaTone = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/90 bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium leading-none tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="shrink-0 text-primary [&_svg]:size-4">{icon}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {delta ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              deltaTone === "positive" &&
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              deltaTone === "negative" &&
                "bg-red-500/10 text-red-700 dark:text-red-400",
              deltaTone === "neutral" &&
                "bg-muted text-muted-foreground"
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
      {trend ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {trend}
        </p>
      ) : null}
    </div>
  );
}
