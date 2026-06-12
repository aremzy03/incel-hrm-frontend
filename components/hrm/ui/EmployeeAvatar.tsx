import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  name: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function EmployeeAvatar({ name, className }: EmployeeAvatarProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary",
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
