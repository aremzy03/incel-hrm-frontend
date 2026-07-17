import type { ReactNode } from "react";

export function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-label-md text-on-surface-variant"
    >
      {children}
      {optional && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          (optional)
        </span>
      )}
    </label>
  );
}
