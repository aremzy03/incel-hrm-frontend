import { ApiError } from "@/lib/api-client";
import type {
  Gender,
  PersonnelFormValues,
  UserPersonnel,
  UserPersonnelPatch,
} from "@/lib/types/personnel";

function str(v: string | null | undefined): string {
  return v ?? "";
}

function dateStr(v: string | null | undefined): string {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

export function personnelToFormValues(data: UserPersonnel): PersonnelFormValues {
  return {
    email: data.email ?? "",
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    other_names: data.other_names ?? "",
    phone: data.phone ?? "",
    gender: data.gender ?? "",
    date_of_birth: dateStr(data.date_of_birth),
    department: data.department?.id ?? "",
    unit: data.unit?.id ?? "",
    team: data.team?.id ?? "",
    staff_id: data.staff_id ?? "",
    date_of_employment: dateStr(data.date_of_employment),
    confirmation_status: data.confirmation_status ?? "",
    confirmation_date: dateStr(data.confirmation_date),
    marital_status: data.marital_status ?? "",
    last_promotion_date: dateStr(data.last_promotion_date),
    is_exited: data.is_exited ?? false,
    exit_reason: data.exit_reason ?? "",
    job_role: data.job_role ?? "",
    cost_centre: data.cost_centre ?? "",
    regions: data.regions ?? "",
    state_of_locations: data.state_of_locations ?? "",
    state_of_origin: data.state_of_origin ?? "",
    lga: data.lga ?? "",
    religion: data.religion ?? "",
    state_of_residence: data.state_of_residence ?? "",
    city_of_residence: data.city_of_residence ?? "",
    landmark_of_residence: data.landmark_of_residence ?? "",
    state_of_permanent_address: data.state_of_permanent_address ?? "",
    city_of_permanent_address: data.city_of_permanent_address ?? "",
    landmark_of_permanent_address: data.landmark_of_permanent_address ?? "",
    residential_address: data.residential_address ?? "",
    permanent_address: data.permanent_address ?? "",
    qualification_school: data.qualification_school ?? "",
    qualification_course: data.qualification_course ?? "",
    qualification_degree: data.qualification_degree ?? "",
    qualification_grade: data.qualification_grade ?? "",
    qualification_start_date: dateStr(data.qualification_start_date),
    qualification_end_date: dateStr(data.qualification_end_date),
    certification_institution: data.certification_institution ?? "",
    certification_course: data.certification_course ?? "",
    certification_issuing_body: data.certification_issuing_body ?? "",
    certification_license_number: data.certification_license_number ?? "",
    certification_start_date: dateStr(data.certification_start_date),
    certification_end_date: dateStr(data.certification_end_date),
    next_of_kin_title: data.next_of_kin_title ?? "",
    next_of_kin_first_name: data.next_of_kin_first_name ?? "",
    next_of_kin_last_name: data.next_of_kin_last_name ?? "",
    next_of_kin_phone: data.next_of_kin_phone ?? "",
    next_of_kin_email: data.next_of_kin_email ?? "",
    next_of_kin_relationship: data.next_of_kin_relationship ?? "",
    next_of_kin_address: data.next_of_kin_address ?? "",
    contract_type: data.contract_type ?? "",
    contract_start_date: dateStr(data.contract_start_date),
    contract_end_date: dateStr(data.contract_end_date),
    tenure_on_grade: data.tenure_on_grade ?? "",
  };
}

const DATE_FIELDS = new Set([
  "date_of_birth",
  "date_of_employment",
  "confirmation_date",
  "last_promotion_date",
  "qualification_start_date",
  "qualification_end_date",
  "certification_start_date",
  "certification_end_date",
  "contract_start_date",
  "contract_end_date",
]);

const ENUM_FIELDS = new Set([
  "gender",
  "confirmation_status",
  "marital_status",
  "contract_type",
]);

const NULLABLE_UUID_FIELDS = new Set(["unit", "team"]);

function toPatchValue(
  key: keyof PersonnelFormValues,
  value: PersonnelFormValues[keyof PersonnelFormValues]
): unknown {
  if (key === "is_exited") return value;

  if (DATE_FIELDS.has(key)) {
    const s = value as string;
    return s === "" ? null : s;
  }

  if (NULLABLE_UUID_FIELDS.has(key)) {
    const s = value as string;
    return s === "" ? null : s;
  }

  if (ENUM_FIELDS.has(key)) {
    const s = value as string;
    return s === "" ? undefined : s;
  }

  if (key === "department") {
    const s = value as string;
    return s === "" ? undefined : s;
  }

  return value;
}

export type PersonnelSectionId =
  | "personal"
  | "location"
  | "organization"
  | "employment"
  | "education"
  | "certification"
  | "nextOfKin"
  | "exit";

export const PERSONNEL_SECTION_FIELDS: Record<
  PersonnelSectionId,
  readonly (keyof PersonnelFormValues)[]
> = {
  personal: [
    "email",
    "first_name",
    "last_name",
    "other_names",
    "phone",
    "gender",
    "date_of_birth",
    "marital_status",
  ],
  location: [
    "state_of_locations",
    "state_of_origin",
    "lga",
    "religion",
    "state_of_residence",
    "city_of_residence",
    "landmark_of_residence",
    "state_of_permanent_address",
    "city_of_permanent_address",
    "landmark_of_permanent_address",
    "residential_address",
    "permanent_address",
  ],
  organization: ["department", "unit", "team"],
  employment: [
    "staff_id",
    "job_role",
    "date_of_employment",
    "confirmation_status",
    "confirmation_date",
    "last_promotion_date",
    "contract_type",
    "contract_start_date",
    "contract_end_date",
    "tenure_on_grade",
    "cost_centre",
    "regions",
  ],
  education: [
    "qualification_school",
    "qualification_course",
    "qualification_degree",
    "qualification_grade",
    "qualification_start_date",
    "qualification_end_date",
  ],
  certification: [
    "certification_institution",
    "certification_course",
    "certification_issuing_body",
    "certification_license_number",
    "certification_start_date",
    "certification_end_date",
  ],
  nextOfKin: [
    "next_of_kin_title",
    "next_of_kin_first_name",
    "next_of_kin_last_name",
    "next_of_kin_phone",
    "next_of_kin_email",
    "next_of_kin_relationship",
    "next_of_kin_address",
  ],
  exit: ["is_exited", "exit_reason"],
};

export function buildPersonnelPatchForFields(
  initial: PersonnelFormValues,
  current: PersonnelFormValues,
  fields: readonly (keyof PersonnelFormValues)[]
): UserPersonnelPatch {
  const patch: UserPersonnelPatch = {};
  for (const key of fields) {
    if (initial[key] !== current[key]) {
      (patch as Record<string, unknown>)[key] = toPatchValue(key, current[key]);
    }
  }
  return patch;
}

export function buildPersonnelPatch(
  initial: PersonnelFormValues,
  current: PersonnelFormValues
): UserPersonnelPatch {
  const keys = Object.keys(current) as (keyof PersonnelFormValues)[];
  return buildPersonnelPatchForFields(initial, current, keys);
}

export function revertFormSectionFields(
  current: PersonnelFormValues,
  baseline: PersonnelFormValues,
  fields: readonly (keyof PersonnelFormValues)[]
): PersonnelFormValues {
  return fields.reduce<PersonnelFormValues>(
    (acc, key) => ({ ...acc, [key]: baseline[key] }),
    { ...current }
  );
}

export function filterFieldErrorsForSection(
  errors: Record<string, string>,
  sectionId: PersonnelSectionId
): Record<string, string> {
  const allowed = new Set<string>(PERSONNEL_SECTION_FIELDS[sectionId]);
  const filtered: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    if (allowed.has(key)) filtered[key] = message;
  }
  return filtered;
}

function extractFieldMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return null;
}

export function parsePersonnelFieldErrors(
  data: unknown
): Record<string, string> {
  if (!data || typeof data !== "object") return {};

  const obj = data as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "detail" || key === "message" || key === "error") continue;
    const msg = extractFieldMessage(value);
    if (msg) errors[key] = msg;
  }

  return errors;
}

export function getPersonnelErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return "You do not have permission to view or edit this personnel record.";
    }
    if (err.status === 404) {
      return "User not found.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "An error occurred.";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatPersonnelDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export { stitchFieldClass as personnelFieldClass } from "@/lib/design/field-styles";

export const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
  { value: "OTHER", label: "Other" },
] as const;

export const CONFIRMATION_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "NOT_APPLICABLE", label: "Not applicable" },
] as const;

export const CONTRACT_TYPE_OPTIONS = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "FIXED_TERM", label: "Fixed term" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
  { value: "OTHER", label: "Other" },
] as const;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

export type { Gender };
