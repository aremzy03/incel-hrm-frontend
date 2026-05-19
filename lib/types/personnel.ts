import type { Gender } from "@/lib/types/auth";

export type { Gender };

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED"
  | "OTHER";

export type ConfirmationStatus = "PENDING" | "CONFIRMED" | "NOT_APPLICABLE";

export type ContractType =
  | "PERMANENT"
  | "FIXED_TERM"
  | "CONTRACT"
  | "INTERN"
  | "OTHER";

export interface PersonnelOrgRef {
  id: string;
  name: string;
}

/** Full personnel record from GET /api/v1/users/{userId}/personnel/ */
export interface UserPersonnel {
  id: string;
  email: string;
  official_email: string;
  first_name: string;
  last_name: string;
  other_names: string;
  full_name: string;
  phone: string;
  gender: Gender;
  date_of_birth: string | null;
  age: number;
  department: PersonnelOrgRef;
  unit: PersonnelOrgRef | null;
  team: PersonnelOrgRef | null;
  date_joined: string;
  updated_at: string;
  staff_id: string;
  date_of_employment: string | null;
  length_of_service_years: number;
  confirmation_status: ConfirmationStatus;
  confirmation_date: string | null;
  marital_status: MaritalStatus;
  last_promotion_date: string | null;
  is_exited: boolean;
  exit_reason: string;
  job_role: string;
  cost_centre: string;
  regions: string;
  state_of_locations: string;
  state_of_origin: string;
  lga: string;
  religion: string;
  state_of_residence: string;
  city_of_residence: string;
  landmark_of_residence: string;
  state_of_permanent_address: string;
  city_of_permanent_address: string;
  landmark_of_permanent_address: string;
  residential_address: string;
  permanent_address: string;
  qualification_school: string;
  qualification_course: string;
  qualification_degree: string;
  qualification_grade: string;
  qualification_start_date: string | null;
  qualification_end_date: string | null;
  certification_institution: string;
  certification_course: string;
  certification_issuing_body: string;
  certification_license_number: string;
  certification_start_date: string | null;
  certification_end_date: string | null;
  next_of_kin_title: string;
  next_of_kin_first_name: string;
  next_of_kin_last_name: string;
  next_of_kin_phone: string;
  next_of_kin_email: string;
  next_of_kin_relationship: string;
  next_of_kin_address: string;
  contract_type: ContractType;
  contract_start_date: string | null;
  contract_end_date: string | null;
  tenure_on_grade: string;
  completeness_score: number;
}

/** Keys excluded from PATCH payloads */
export type UserPersonnelReadOnlyKeys =
  | "id"
  | "full_name"
  | "official_email"
  | "age"
  | "length_of_service_years"
  | "completeness_score"
  | "date_joined"
  | "updated_at"
  | "department"
  | "unit"
  | "team";

export type UserPersonnelWritable = Omit<
  UserPersonnel,
  UserPersonnelReadOnlyKeys
> & {
  department?: string;
  unit?: string | null;
  team?: string | null;
};

export type UserPersonnelPatch = Partial<UserPersonnelWritable>;

/** Flat form state used by PersonnelForm */
export type PersonnelFormValues = {
  email: string;
  first_name: string;
  last_name: string;
  other_names: string;
  phone: string;
  gender: Gender | "";
  date_of_birth: string;
  department: string;
  unit: string;
  team: string;
  staff_id: string;
  date_of_employment: string;
  confirmation_status: ConfirmationStatus | "";
  confirmation_date: string;
  marital_status: MaritalStatus | "";
  last_promotion_date: string;
  is_exited: boolean;
  exit_reason: string;
  job_role: string;
  cost_centre: string;
  regions: string;
  state_of_locations: string;
  state_of_origin: string;
  lga: string;
  religion: string;
  state_of_residence: string;
  city_of_residence: string;
  landmark_of_residence: string;
  state_of_permanent_address: string;
  city_of_permanent_address: string;
  landmark_of_permanent_address: string;
  residential_address: string;
  permanent_address: string;
  qualification_school: string;
  qualification_course: string;
  qualification_degree: string;
  qualification_grade: string;
  qualification_start_date: string;
  qualification_end_date: string;
  certification_institution: string;
  certification_course: string;
  certification_issuing_body: string;
  certification_license_number: string;
  certification_start_date: string;
  certification_end_date: string;
  next_of_kin_title: string;
  next_of_kin_first_name: string;
  next_of_kin_last_name: string;
  next_of_kin_phone: string;
  next_of_kin_email: string;
  next_of_kin_relationship: string;
  next_of_kin_address: string;
  contract_type: ContractType | "";
  contract_start_date: string;
  contract_end_date: string;
  tenure_on_grade: string;
};
