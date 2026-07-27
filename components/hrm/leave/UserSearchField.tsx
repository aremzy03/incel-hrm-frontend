"use client";

import { useId, useMemo, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsersPage } from "@/lib/api/users";
import { stitchFieldClass } from "@/lib/design/field-styles";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";

function displayName(u: {
  first_name?: string;
  last_name?: string;
  email?: string;
}): string {
  const composed = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return composed || u.email || "Unknown user";
}

export function UserSearchField({
  id: idProp,
  label,
  value,
  onChange,
  placeholder = "Search by name or email…",
  optional,
  error,
  disabled,
}: {
  id?: string;
  label: string;
  value: string | null;
  onChange: (userId: string | null, display?: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string | null;
  disabled?: boolean;
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  const { data, isLoading } = useUsersPage({
    page: 1,
    search: search.trim() || undefined,
  });

  const users = data?.results ?? [];

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value),
    [users, value]
  );

  const displayValue =
    selectedUser
      ? displayName(selectedUser)
      : selectedLabel || (value ? "Selected user" : "");

  function pickUser(user: { id: string; first_name: string; last_name: string; email: string }) {
    onChange(user.id, displayName(user));
    setSelectedLabel(displayName(user));
    setSearch("");
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setSelectedLabel("");
    setSearch("");
  }

  return (
    <div>
      <FieldLabel htmlFor={inputId} optional={optional}>{label}</FieldLabel>
      {value ? (
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3">
          <span className="flex-1 text-sm text-on-surface">{displayValue}</span>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={inputId}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(stitchFieldClass, "pl-9")}
          />
          {open && (search.trim() || users.length > 0) && (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg"
              role="listbox"
            >
              {isLoading ? (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </li>
              ) : users.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No users found.
                </li>
              ) : (
                users.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === u.id}
                      onClick={() => pickUser(u)}
                      className="w-full px-3 py-2 text-left text-sm transition hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">
                        {displayName(u)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
