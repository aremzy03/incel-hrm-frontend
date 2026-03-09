interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
      )}
    </div>
  );
}
