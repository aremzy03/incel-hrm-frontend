import Link from "next/link";
import { Construction, Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Construction className="mb-6 h-16 w-16 text-muted-foreground/40" />

      <h1 className="font-sans text-2xl font-semibold text-foreground">
        {title}
      </h1>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs text-accent-foreground">
        <Clock className="h-3 w-3" />
        Coming in Phase 1
      </span>

      <Link
        href="/leave"
        className="mt-8 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        Back to Leave Management
      </Link>
    </div>
  );
}
