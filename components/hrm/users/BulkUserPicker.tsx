import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";

/** Minimal user row for pickers (matches `User`, `UserMinimal`, and nested department/unit members). */
export type BulkUserPickerUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string | null;
};

function displayName(u: BulkUserPickerUser): string {
  const full = (u.full_name ?? "").trim();
  if (full) return full;
  const composed = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return composed || u.email || "Unknown user";
}

export function BulkUserPicker({
  users,
  selectedUserIds,
  onChangeSelectedUserIds,
  search,
  onChangeSearch,
  disabled,
  emptyText = "No users found.",
  label = "Users",
}: {
  users: BulkUserPickerUser[];
  selectedUserIds: string[];
  onChangeSelectedUserIds: (next: string[]) => void;
  search: string;
  onChangeSearch: (next: string) => void;
  disabled?: boolean;
  emptyText?: string;
  label?: string;
}) {
  const inputId = useId();

  const normalized = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return users;
    return users.filter((u) => {
      const hay = `${displayName(u)} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [users, normalized]);

  const selected = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  function toggleUser(id: string) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeSelectedUserIds(Array.from(next));
  }

  function selectAllVisible() {
    if (disabled) return;
    const next = new Set(selected);
    for (const u of filtered) next.add(u.id);
    onChangeSelectedUserIds(Array.from(next));
  }

  function clearVisible() {
    if (disabled) return;
    const next = new Set(selected);
    for (const u of filtered) next.delete(u.id);
    onChangeSelectedUserIds(Array.from(next));
  }

  function clearAll() {
    if (disabled) return;
    onChangeSelectedUserIds([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{selectedUserIds.length}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={allVisibleSelected ? clearVisible : selectAllVisible}
            disabled={disabled || filtered.length === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
          >
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled || selectedUserIds.length === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          id={inputId}
          value={search}
          onChange={(e) => onChangeSearch(e.target.value)}
          disabled={disabled}
          placeholder="Search by name or email…"
          className={cn(
            "w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition",
            disabled && "opacity-60"
          )}
        />
        {search.trim().length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChangeSearch("")}
            className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((u) => {
                const isChecked = selected.has(u.id);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition",
                        "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                        disabled && "opacity-60"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {displayName(u)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-transparent"
                        )}
                        aria-hidden="true"
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

