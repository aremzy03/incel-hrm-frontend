import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-8 flex items-center gap-2 text-body-md" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 ? (
              <ChevronRight className="h-4 w-4 text-outline" aria-hidden />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-semibold text-primary-container hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-on-surface-variant">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
