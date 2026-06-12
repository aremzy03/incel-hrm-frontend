"use client";

import { useState } from "react";
import { useChangePassword } from "@/lib/api/password";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PersonnelForm } from "@/components/hrm/personnel/PersonnelForm";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { stitchCardClass, stitchFieldClass } from "@/lib/design/field-styles";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser, logout } = useAuth();
  const changePassword = useChangePassword();

  const [pwd, setPwd] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);

    if (!pwd.current_password || !pwd.new_password || !pwd.new_password_confirm) {
      setPwdError("Please fill in all password fields.");
      return;
    }
    if (pwd.new_password !== pwd.new_password_confirm) {
      setPwdError("New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword.mutateAsync({
        current_password: pwd.current_password,
        new_password: pwd.new_password,
        new_password_confirm: pwd.new_password_confirm,
      });
      await logout();
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : "Failed to change password.");
    }
  }

  if (authLoading || !user?.id) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="My profile"
        subtitle="Update your personnel record and account settings"
      />

      <div className="mx-auto max-w-6xl space-y-6">
        <PersonnelForm userId={user.id} onSaved={() => refreshUser()} />

        <form
          onSubmit={handleChangePassword}
          className={cn(stitchCardClass, "p-6 ambient-shadow")}
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <KeyRound className="h-4 w-4" />
            Change password
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            After changing your password, you’ll be logged out and need to sign in again.
          </p>
          {pwdError && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {pwdError}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-current-password"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Current password
              </label>
              <div className="relative">
                <input
                  id="profile-current-password"
                  className={stitchFieldClass}
                  type={showPwd.current ? "text" : "password"}
                  autoComplete="current-password"
                  value={pwd.current_password}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, current_password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPwd((s) => ({ ...s, current: !s.current }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={showPwd.current ? "Hide password" : "Show password"}
                  disabled={changePassword.isPending}
                >
                  {showPwd.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-new-password"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    className={stitchFieldClass}
                    type={showPwd.next ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwd.new_password}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, new_password: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={showPwd.next ? "Hide password" : "Show password"}
                    disabled={changePassword.isPending}
                  >
                    {showPwd.next ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-new-password-confirm"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password-confirm"
                    className={stitchFieldClass}
                    type={showPwd.confirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwd.new_password_confirm}
                    onChange={(e) =>
                      setPwd((p) => ({
                        ...p,
                        new_password_confirm: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd((s) => ({ ...s, confirm: !s.confirm }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={showPwd.confirm ? "Hide password" : "Show password"}
                    disabled={changePassword.isPending}
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {changePassword.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Update password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
