"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function loginHrefFromNext(nextParam: string | null): string {
  if (!nextParam || nextParam.length > 1500) return "/";
  return `/?next=${encodeURIComponent(nextParam)}`;
}

function LoginLinkInner({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  return (
    <Link href={loginHrefFromNext(searchParams.get("next"))} className={className}>
      {children}
    </Link>
  );
}

/** Sign-in link that preserves optional `next` return URL from the current page query. */
export function LoginLinkWithNext({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Link href="/" className={className}>
          {children}
        </Link>
      }
    >
      <LoginLinkInner className={className}>{children}</LoginLinkInner>
    </Suspense>
  );
}
