"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Save } from "lucide-react";
import { usePersonnel, useUpdatePersonnel } from "@/lib/api/personnel";
import { ApiError } from "@/lib/api-client";
import {
  buildPersonnelPatchForFields,
  CONFIRMATION_STATUS_OPTIONS,
  filterFieldErrorsForSection,
  PERSONNEL_SECTION_FIELDS,
  revertFormSectionFields,
  CONTRACT_TYPE_OPTIONS,
  formatPersonnelDate,
  getInitials,
  getPersonnelErrorMessage,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  parsePersonnelFieldErrors,
  personnelFieldClass,
  personnelToFormValues,
} from "@/lib/personnel/form";
import type { PersonnelFormValues, UserPersonnel } from "@/lib/types/personnel";
import type { PersonnelSectionId } from "@/lib/personnel/form";
import { cn } from "@/lib/utils";
import { stitchCardClass } from "@/lib/design/field-styles";

interface PersonnelFormProps {
  userId: string;
  readOnly?: boolean;
  onSaved?: (data: UserPersonnel) => void;
}

function EditableSection({
  title,
  sectionId,
  allowEdit,
  editing,
  saving,
  saveSuccess,
  sectionError,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string;
  sectionId: PersonnelSectionId;
  allowEdit: boolean;
  editing: boolean;
  saving: boolean;
  saveSuccess: boolean;
  sectionError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(stitchCardClass, "p-6")}
      aria-labelledby={`section-${sectionId}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 id={`section-${sectionId}`} className="text-base font-semibold text-foreground">
          {title}
        </h3>
        {allowEdit && !editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
        ) : null}
      </div>

      {sectionError ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {sectionError}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Changes saved successfully.
        </p>
      ) : null}

      {children}

      {allowEdit && editing ? (
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
  className,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const grid2 = "grid gap-4 sm:grid-cols-2";

export function PersonnelForm({ userId, readOnly = false, onSaved }: PersonnelFormProps) {
  const { data: personnel, isLoading, error } = usePersonnel(userId);
  const updatePersonnel = useUpdatePersonnel(userId);
  const [form, setForm] = useState<PersonnelFormValues | null>(null);
  const [baseline, setBaseline] = useState<PersonnelFormValues | null>(null);
  const [display, setDisplay] = useState<UserPersonnel | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editingSections, setEditingSections] = useState<Set<PersonnelSectionId>>(new Set());
  const [savingSection, setSavingSection] = useState<PersonnelSectionId | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<PersonnelSectionId, string>>>(
    {}
  );
  const [sectionSuccess, setSectionSuccess] = useState<Partial<Record<PersonnelSectionId, boolean>>>(
    {}
  );

  useEffect(() => {
    if (!personnel) return;
    const values = personnelToFormValues(personnel);
    setForm(values);
    setBaseline(values);
    setDisplay(personnel);
    setFieldErrors({});
    setEditingSections(new Set());
    setSavingSection(null);
    setSectionErrors({});
    setSectionSuccess({});
  }, [personnel]);

  function isSectionEditing(sectionId: PersonnelSectionId) {
    return editingSections.has(sectionId);
  }

  function sectionDisabled(sectionId: PersonnelSectionId) {
    if (readOnly) return true;
    if (!isSectionEditing(sectionId)) return true;
    return savingSection === sectionId && updatePersonnel.isPending;
  }

  function setField<K extends keyof PersonnelFormValues>(
    key: K,
    value: PersonnelFormValues[K]
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    const sid = sectionIdForField(key);
    if (sid) {
      setSectionSuccess((prev) => ({ ...prev, [sid]: false }));
    }
  }

  function sectionIdForField(key: keyof PersonnelFormValues): PersonnelSectionId | null {
    for (const [sectionId, fields] of Object.entries(PERSONNEL_SECTION_FIELDS) as [
      PersonnelSectionId,
      readonly (keyof PersonnelFormValues)[],
    ][]) {
      if (fields.includes(key)) return sectionId;
    }
    return null;
  }

  function handleSectionEdit(sectionId: PersonnelSectionId) {
    setEditingSections((prev) => new Set(prev).add(sectionId));
    setSectionErrors((prev) => ({ ...prev, [sectionId]: undefined }));
    setSectionSuccess((prev) => ({ ...prev, [sectionId]: false }));
  }

  function handleSectionCancel(sectionId: PersonnelSectionId) {
    if (!form || !baseline) return;

    const fields = PERSONNEL_SECTION_FIELDS[sectionId];
    setForm((prev) => (prev ? revertFormSectionFields(prev, baseline, fields) : prev));
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of fields) {
        delete next[key];
      }
      return next;
    });
    setEditingSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
    setSectionErrors((prev) => ({ ...prev, [sectionId]: undefined }));
    setSectionSuccess((prev) => ({ ...prev, [sectionId]: false }));
  }

  async function handleSectionSave(sectionId: PersonnelSectionId) {
    if (!form || !baseline || readOnly) return;

    setSectionErrors((prev) => ({ ...prev, [sectionId]: undefined }));
    setSectionSuccess((prev) => ({ ...prev, [sectionId]: false }));

    const fields = PERSONNEL_SECTION_FIELDS[sectionId];
    const patch = buildPersonnelPatchForFields(baseline, form, fields);
    if (Object.keys(patch).length === 0) {
      setSectionErrors((prev) => ({
        ...prev,
        [sectionId]: "No changes to save.",
      }));
      return;
    }

    setSavingSection(sectionId);
    try {
      const updated = await updatePersonnel.mutateAsync(patch);
      const values = personnelToFormValues(updated);
      setForm(values);
      setBaseline(values);
      setDisplay(updated);
      setFieldErrors((prev) => {
        const next = { ...prev };
        for (const key of fields) {
          delete next[key];
        }
        return next;
      });
      setEditingSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
      setSectionSuccess((prev) => ({ ...prev, [sectionId]: true }));
      onSaved?.(updated);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const parsed = parsePersonnelFieldErrors(err.data);
        const sectionOnly = filterFieldErrorsForSection(parsed, sectionId);
        if (Object.keys(sectionOnly).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...sectionOnly }));
          setSectionErrors((prev) => ({
            ...prev,
            [sectionId]: "Please fix the highlighted fields.",
          }));
          return;
        }
      }
      setSectionErrors((prev) => ({
        ...prev,
        [sectionId]: getPersonnelErrorMessage(err),
      }));
    } finally {
      setSavingSection(null);
    }
  }

  function sectionProps(sectionId: PersonnelSectionId) {
    const allowEdit = !readOnly && sectionId !== "organization";
    return {
      sectionId,
      allowEdit,
      editing: isSectionEditing(sectionId),
      saving: savingSection === sectionId && updatePersonnel.isPending,
      saveSuccess: Boolean(sectionSuccess[sectionId]),
      sectionError: sectionErrors[sectionId] ?? null,
      onEdit: () => handleSectionEdit(sectionId),
      onCancel: () => handleSectionCancel(sectionId),
      onSave: () => void handleSectionSave(sectionId),
    };
  }

  if (isLoading || !form || !display) {
    return (
      <div className="flex min-h-[24vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        {getPersonnelErrorMessage(error)}
      </div>
    );
  }

  const score = Math.min(100, Math.max(0, display.completeness_score ?? 0));
  const err = (key: keyof PersonnelFormValues) => fieldErrors[key];

  const deptLabel = display.department?.name ?? "—";
  const unitLabel = display.unit?.name;
  const roleSubtitle = [display.job_role, unitLabel ? `${deptLabel} · ${unitLabel}` : deptLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <nav className="flex gap-6 border-b border-border" aria-label="Profile sections">
        <span className="-mb-px border-b-2 border-primary pb-3 text-sm font-medium text-foreground">
          Staff profile
        </span>
      </nav>

      <div className={cn(stitchCardClass, "p-6")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center lg:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {getInitials(display.full_name)}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{display.full_name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{roleSubtitle || "—"}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Profile completion</span>
                  <span className="font-semibold text-foreground">{score}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Profile completion"
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden w-px shrink-0 bg-border lg:block" aria-hidden />

          <dl className="grid min-w-0 flex-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:py-1">
            <div>
              <dt className="text-xs text-muted-foreground">Staff ID</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {display.staff_id || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Official email</dt>
              <dd className="mt-0.5 break-all text-sm font-medium text-foreground">
                {display.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone number</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {display.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Age</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {display.age ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Length of service</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {display.length_of_service_years != null
                  ? `${display.length_of_service_years.toFixed(1)} yrs`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Date joined</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {formatPersonnelDate(display.date_joined)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
      <EditableSection title="Personal information" {...sectionProps("personal")}>
        <div className={cn(grid2)}>
          <Field label="First name" id="pf-first-name" error={err("first_name")}>
            <input
              id="pf-first-name"
              className={personnelFieldClass}
              value={form.first_name}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("first_name", e.target.value)}
            />
          </Field>
          <Field label="Last name" id="pf-last-name" error={err("last_name")}>
            <input
              id="pf-last-name"
              className={personnelFieldClass}
              value={form.last_name}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("last_name", e.target.value)}
            />
          </Field>
          <Field label="Other names" id="pf-other-names" error={err("other_names")}>
            <input
              id="pf-other-names"
              className={personnelFieldClass}
              value={form.other_names}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("other_names", e.target.value)}
            />
          </Field>
          <Field label="Phone" id="pf-phone" error={err("phone")}>
            <input
              id="pf-phone"
              type="tel"
              className={personnelFieldClass}
              value={form.phone}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </Field>
          <Field label="Official email" id="pf-email" error={err("email")}>
            <input
              id="pf-email"
              type="email"
              className={personnelFieldClass}
              value={form.email}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("email", e.target.value)}
            />
          </Field>
          <Field label="Gender" id="pf-gender" error={err("gender")}>
            <select
              id="pf-gender"
              className={personnelFieldClass}
              value={form.gender}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("gender", e.target.value as PersonnelFormValues["gender"])}
            >
              <option value="">—</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date of birth" id="pf-dob" error={err("date_of_birth")}>
            <input
              id="pf-dob"
              type="date"
              className={personnelFieldClass}
              value={form.date_of_birth}
              disabled={sectionDisabled("personal")}
              onChange={(e) => setField("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Marital status" id="pf-marital" error={err("marital_status")}>
            <select
              id="pf-marital"
              className={personnelFieldClass}
              value={form.marital_status}
              disabled={sectionDisabled("personal")}
              onChange={(e) =>
                setField("marital_status", e.target.value as PersonnelFormValues["marital_status"])
              }
            >
              <option value="">—</option>
              {MARITAL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </EditableSection>

      <EditableSection title="Location" {...sectionProps("location")}>
        <div className={cn(grid2)}>
          {(
            [
              ["State of locations", "state_of_locations", "pf-state-loc"],
              ["State of origin", "state_of_origin", "pf-state-origin"],
              ["LGA", "lga", "pf-lga"],
              ["Religion", "religion", "pf-religion"],
              ["State of residence", "state_of_residence", "pf-state-res"],
              ["City of residence", "city_of_residence", "pf-city-res"],
              ["Landmark of residence", "landmark_of_residence", "pf-land-res"],
              ["State of permanent address", "state_of_permanent_address", "pf-state-perm"],
              ["City of permanent address", "city_of_permanent_address", "pf-city-perm"],
              ["Landmark of permanent address", "landmark_of_permanent_address", "pf-land-perm"],
            ] as const
          ).map(([label, key, id]) => (
            <Field key={key} label={label} id={id} error={err(key)}>
              <input
                id={id}
                className={personnelFieldClass}
                value={form[key]}
                disabled={sectionDisabled("location")}
                onChange={(e) => setField(key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Residential address" id="pf-res-addr" error={err("residential_address")} className="sm:col-span-2">
            <textarea
              id="pf-res-addr"
              rows={2}
              className={personnelFieldClass}
              value={form.residential_address}
              disabled={sectionDisabled("location")}
              onChange={(e) => setField("residential_address", e.target.value)}
            />
          </Field>
          <Field label="Permanent address" id="pf-perm-addr" error={err("permanent_address")} className="sm:col-span-2">
            <textarea
              id="pf-perm-addr"
              rows={2}
              className={personnelFieldClass}
              value={form.permanent_address}
              disabled={sectionDisabled("location")}
              onChange={(e) => setField("permanent_address", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>

        </div>

        <div className="space-y-6 lg:col-span-7">
      <EditableSection title="Organization" {...sectionProps("organization")}>
        <div className={grid2}>
          <ReadOnlyValue label="Department" value={display.department?.name ?? ""} />
          <ReadOnlyValue label="Unit" value={display.unit?.name ?? ""} />
          <ReadOnlyValue label="Team" value={display.team?.name ?? ""} />
        </div>
      </EditableSection>

      <EditableSection title="Employment" {...sectionProps("employment")}>
        <div className={cn(grid2)}>
          <Field label="Staff ID" id="pf-staff-id" error={err("staff_id")}>
            <input
              id="pf-staff-id"
              className={personnelFieldClass}
              value={form.staff_id}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("staff_id", e.target.value)}
            />
          </Field>
          <Field label="Job role" id="pf-job-role" error={err("job_role")}>
            <input
              id="pf-job-role"
              className={personnelFieldClass}
              value={form.job_role}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("job_role", e.target.value)}
            />
          </Field>
          <Field label="Date of employment" id="pf-doe" error={err("date_of_employment")}>
            <input
              id="pf-doe"
              type="date"
              className={personnelFieldClass}
              value={form.date_of_employment}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("date_of_employment", e.target.value)}
            />
          </Field>
          <Field label="Confirmation status" id="pf-conf-status" error={err("confirmation_status")}>
            <select
              id="pf-conf-status"
              className={personnelFieldClass}
              value={form.confirmation_status}
              disabled={sectionDisabled("employment")}
              onChange={(e) =>
                setField(
                  "confirmation_status",
                  e.target.value as PersonnelFormValues["confirmation_status"]
                )
              }
            >
              <option value="">—</option>
              {CONFIRMATION_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Confirmation date" id="pf-conf-date" error={err("confirmation_date")}>
            <input
              id="pf-conf-date"
              type="date"
              className={personnelFieldClass}
              value={form.confirmation_date}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("confirmation_date", e.target.value)}
            />
          </Field>
          <Field label="Last promotion date" id="pf-promo" error={err("last_promotion_date")}>
            <input
              id="pf-promo"
              type="date"
              className={personnelFieldClass}
              value={form.last_promotion_date}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("last_promotion_date", e.target.value)}
            />
          </Field>
          <Field label="Contract type" id="pf-contract-type" error={err("contract_type")}>
            <select
              id="pf-contract-type"
              className={personnelFieldClass}
              value={form.contract_type}
              disabled={sectionDisabled("employment")}
              onChange={(e) =>
                setField("contract_type", e.target.value as PersonnelFormValues["contract_type"])
              }
            >
              <option value="">—</option>
              {CONTRACT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contract start" id="pf-contract-start" error={err("contract_start_date")}>
            <input
              id="pf-contract-start"
              type="date"
              className={personnelFieldClass}
              value={form.contract_start_date}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("contract_start_date", e.target.value)}
            />
          </Field>
          <Field label="Contract end" id="pf-contract-end" error={err("contract_end_date")}>
            <input
              id="pf-contract-end"
              type="date"
              className={personnelFieldClass}
              value={form.contract_end_date}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("contract_end_date", e.target.value)}
            />
          </Field>
          <Field label="Tenure on grade" id="pf-tenure" error={err("tenure_on_grade")}>
            <input
              id="pf-tenure"
              className={personnelFieldClass}
              value={form.tenure_on_grade}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("tenure_on_grade", e.target.value)}
            />
          </Field>
          <Field label="Cost centre" id="pf-cost" error={err("cost_centre")}>
            <input
              id="pf-cost"
              className={personnelFieldClass}
              value={form.cost_centre}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("cost_centre", e.target.value)}
            />
          </Field>
          <Field label="Regions" id="pf-regions" error={err("regions")}>
            <input
              id="pf-regions"
              className={personnelFieldClass}
              value={form.regions}
              disabled={sectionDisabled("employment")}
              onChange={(e) => setField("regions", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>


      <EditableSection title="Education information" {...sectionProps("education")}>
        <div className={cn(grid2)}>
          {(
            [
              ["School", "qualification_school", "pf-qual-school"],
              ["Course", "qualification_course", "pf-qual-course"],
              ["Degree", "qualification_degree", "pf-qual-degree"],
              ["Grade", "qualification_grade", "pf-qual-grade"],
            ] as const
          ).map(([label, key, id]) => (
            <Field key={key} label={label} id={id} error={err(key)}>
              <input
                id={id}
                className={personnelFieldClass}
                value={form[key]}
                disabled={sectionDisabled("education")}
                onChange={(e) => setField(key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Start date" id="pf-qual-start" error={err("qualification_start_date")}>
            <input
              id="pf-qual-start"
              type="date"
              className={personnelFieldClass}
              value={form.qualification_start_date}
              disabled={sectionDisabled("education")}
              onChange={(e) => setField("qualification_start_date", e.target.value)}
            />
          </Field>
          <Field label="End date" id="pf-qual-end" error={err("qualification_end_date")}>
            <input
              id="pf-qual-end"
              type="date"
              className={personnelFieldClass}
              value={form.qualification_end_date}
              disabled={sectionDisabled("education")}
              onChange={(e) => setField("qualification_end_date", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>

      <EditableSection title="Certification" {...sectionProps("certification")}>
        <div className={cn(grid2)}>
          {(
            [
              ["Institution", "certification_institution", "pf-cert-inst"],
              ["Course", "certification_course", "pf-cert-course"],
              ["Issuing body", "certification_issuing_body", "pf-cert-body"],
              ["License number", "certification_license_number", "pf-cert-lic"],
            ] as const
          ).map(([label, key, id]) => (
            <Field key={key} label={label} id={id} error={err(key)}>
              <input
                id={id}
                className={personnelFieldClass}
                value={form[key]}
                disabled={sectionDisabled("certification")}
                onChange={(e) => setField(key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Start date" id="pf-cert-start" error={err("certification_start_date")}>
            <input
              id="pf-cert-start"
              type="date"
              className={personnelFieldClass}
              value={form.certification_start_date}
              disabled={sectionDisabled("certification")}
              onChange={(e) => setField("certification_start_date", e.target.value)}
            />
          </Field>
          <Field label="End date" id="pf-cert-end" error={err("certification_end_date")}>
            <input
              id="pf-cert-end"
              type="date"
              className={personnelFieldClass}
              value={form.certification_end_date}
              disabled={sectionDisabled("certification")}
              onChange={(e) => setField("certification_end_date", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>

      <EditableSection title="Next of kin" {...sectionProps("nextOfKin")}>
        <div className={cn(grid2)}>
          {(
            [
              ["Title", "next_of_kin_title", "pf-nok-title"],
              ["First name", "next_of_kin_first_name", "pf-nok-fn"],
              ["Last name", "next_of_kin_last_name", "pf-nok-ln"],
              ["Phone", "next_of_kin_phone", "pf-nok-phone"],
              ["Email", "next_of_kin_email", "pf-nok-email"],
              ["Relationship", "next_of_kin_relationship", "pf-nok-rel"],
            ] as const
          ).map(([label, key, id]) => (
            <Field key={key} label={label} id={id} error={err(key)}>
              <input
                id={id}
                type={key === "next_of_kin_email" ? "email" : key === "next_of_kin_phone" ? "tel" : "text"}
                className={personnelFieldClass}
                value={form[key]}
                disabled={sectionDisabled("nextOfKin")}
                onChange={(e) => setField(key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Address" id="pf-nok-addr" error={err("next_of_kin_address")} className="sm:col-span-2">
            <textarea
              id="pf-nok-addr"
              rows={2}
              className={personnelFieldClass}
              value={form.next_of_kin_address}
              disabled={sectionDisabled("nextOfKin")}
              onChange={(e) => setField("next_of_kin_address", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>

      <EditableSection title="Exit" {...sectionProps("exit")}>
        <div className={cn(grid2)}>
          <Field label="Exited" id="pf-exited" error={err("is_exited")}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                id="pf-exited"
                type="checkbox"
                checked={form.is_exited}
                disabled={sectionDisabled("exit")}
                onChange={(e) => setField("is_exited", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Employee has exited
            </label>
          </Field>
          <Field label="Exit reason" id="pf-exit-reason" error={err("exit_reason")} className="sm:col-span-2">
            <textarea
              id="pf-exit-reason"
              rows={2}
              className={personnelFieldClass}
              value={form.exit_reason}
              disabled={sectionDisabled("exit")}
              onChange={(e) => setField("exit_reason", e.target.value)}
            />
          </Field>
        </div>
      </EditableSection>
        </div>
      </div>

    </div>
  );
}
