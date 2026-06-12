"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PersonnelForm } from "@/components/hrm/personnel/PersonnelForm";
import { useUser } from "@/lib/api/users";
import { useResetUserPassword } from "@/lib/api/password";
import { cn } from "@/lib/utils";
import { stitchCardClass, stitchFieldClass } from "@/lib/design/field-styles";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: user, isLoading: userLoading } = useUser(id);
  const resetPassword = useResetUserPassword(id);

  const [form, setForm] = useState({
    new_password: "",
    new_password_confirm: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState({ next: false, confirm: false });

  const rolesLabel = useMemo(
    () => (user?.roles?.length ? user.roles.join(", ") : null),
    [user]
  );

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

  if (!id) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="User details" />
        <p className="text-destructive">Invalid user.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 space-y-1">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/users" className="hover:text-foreground">
            Users
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Staff detail</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        {userLoading ? (
          <div className="flex min-h-[12vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                user.is_active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
            {rolesLabel ? (
              <span className="text-muted-foreground">
                Roles: <span className="font-medium text-foreground">{rolesLabel}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        <PersonnelForm userId={id} />

        <form
          onSubmit={handleReset}
          className={cn(stitchCardClass, "p-6")}
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
                  className={stitchFieldClass}
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
                  className={stitchFieldClass}
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
