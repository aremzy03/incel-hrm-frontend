interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
