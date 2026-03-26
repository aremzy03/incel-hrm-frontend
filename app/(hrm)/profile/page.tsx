"use client";

import { useState } from "react";
import { useProfile, useUpdateProfile } from "@/lib/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Pencil, Loader2, User } from "lucide-react";
import type { ProfileUpdatePayload, Gender } from "@/lib/types/auth";

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileUpdatePayload>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    if (!profile) return;
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? "",
      gender: profile.gender,
      date_of_birth: profile.date_of_birth ?? "",
    });
    setEditing(true);
    setSaveError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      const payload: ProfileUpdatePayload = {};
      if (form.first_name !== undefined) payload.first_name = form.first_name;
      if (form.last_name !== undefined) payload.last_name = form.last_name;
      if (form.phone !== undefined) payload.phone = form.phone;
      if (form.gender !== undefined) payload.gender = form.gender;
      if (form.date_of_birth !== undefined)
        payload.date_of_birth = form.date_of_birth || null;
      await updateProfile.mutateAsync(payload);
      await refreshUser();
      setEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  function cancelEdit() {
    setEditing(false);
    setForm({});
    setSaveError(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <PageHeader title="Profile" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Failed to load profile."}
        </div>
      </div>
    );
  }

  const deptName =
    typeof profile.department === "object" && profile.department
      ? profile.department.name
      : profile.department ?? null;

  return (
    <div className="p-6">
      <PageHeader title="Profile" />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Summary card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {getInitials(profile.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {profile.full_name}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.roles?.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : null}
              {deptName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {deptName}
                </p>
              )}
            </div>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Edit profile"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <User className="h-4 w-4" />
              Personal information
            </h3>
            {saveError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-first-name"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  First name
                </label>
                <input
                  id="profile-first-name"
                  className={fieldClass}
                  value={form.first_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="profile-last-name"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  Last name
                </label>
                <input
                  id="profile-last-name"
                  className={fieldClass}
                  value={form.last_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="profile-phone"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                className={fieldClass}
                value={form.phone ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+234..."
              />
            </div>
            <div className="mt-4">
              <label
                htmlFor="profile-gender"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Gender
              </label>
              <select
                id="profile-gender"
                className={fieldClass}
                value={form.gender ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gender: (e.target.value || undefined) as Gender | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="mt-4">
              <label
                htmlFor="profile-dob"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Date of birth
              </label>
              <input
                id="profile-dob"
                type="date"
                className={fieldClass}
                value={form.date_of_birth ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    date_of_birth: e.target.value || null,
                  }))
                }
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {updateProfile.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save
              </button>
            </div>
          </form>
        )}

        {/* Read-only fields (roles, department - admin only) */}
        {!editing && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Account details (managed by admin)
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Department</dt>
                <dd className="font-medium text-foreground">
                  {deptName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="font-medium text-foreground">
                  {profile.roles?.join(", ") ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
