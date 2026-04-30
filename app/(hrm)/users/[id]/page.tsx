"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, User2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useUser } from "@/lib/api/users";
import { useResetUserPassword } from "@/lib/api/password";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function getDepartmentName(
  dept: string | { id: string; name: string } | null | undefined
): string | null {
  if (!dept) return null;
  if (typeof dept === "string") return dept;
  return dept.name ?? null;
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: user, isLoading, error } = useUser(id);
  const resetPassword = useResetUserPassword(id);

  const [form, setForm] = useState({
    new_password: "",
    new_password_confirm: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState({ next: false, confirm: false });

  const deptName = useMemo(() => getDepartmentName(user?.department), [user?.department]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!form.new_password || !form.new_password_confirm) {
      setFormError("Please fill in both password fields.");
      return;
    }
    if (form.new_password !== form.new_password_confirm) {
      setFormError("New password and confirmation do not match.");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        new_password: form.new_password,
        new_password_confirm: form.new_password_confirm,
      });
      setForm({ new_password: "", new_password_confirm: "" });
      setShowPwd({ next: false, confirm: false });
      setSuccess("Password reset successfully.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to reset password.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <PageHeader title="User details" />
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Failed to load user."}
        </div>
        <div className="mt-4">
          <Link
            href="/users"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <PageHeader title="User details" />
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {deptName ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p
                    className={cn(
                      "mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                      user.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              {user.roles?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleReset}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <KeyRound className="h-4 w-4" />
            Reset password
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This will set a new password for this user.
          </p>

          {formError && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              {success}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reset-new-password"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  className={fieldClass}
                  type={showPwd.next ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.new_password}
                  onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPwd.next ? "Hide password" : "Show password"}
                  disabled={resetPassword.isPending}
                >
                  {showPwd.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="reset-new-password-confirm"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="reset-new-password-confirm"
                  className={fieldClass}
                  type={showPwd.confirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.new_password_confirm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, new_password_confirm: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPwd.confirm ? "Hide password" : "Show password"}
                  disabled={resetPassword.isPending}
                >
                  {showPwd.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

