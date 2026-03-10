export type RoleName =
  | "EMPLOYEE"
  | "LINE_MANAGER"
  | "HR"
  | "EXECUTIVE_DIRECTOR"
  | "MANAGING_DIRECTOR";

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  created_at: string;
}

export type Gender = "MALE" | "FEMALE";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  gender?: Gender;
  date_of_birth?: string | null;
  is_active: boolean;
  roles: string[];
  department: string | { id: string; name: string } | null;
  date_joined: string;
  updated_at: string;
}

export interface UserMinimal {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  /** Backend may return UUID string or nested user object */
  line_manager: string | UserMinimal | null;
  created_at: string;
  updated_at: string;
}

// ─── Payload types ──────────────────────────────────────────────────────────

export interface UserCreatePayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  phone?: string;
  department?: string;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  date_of_birth?: string | null;
  phone?: string;
  department?: string | null;
  is_active?: boolean;
}

export interface DepartmentPayload {
  name: string;
  description?: string;
}

export interface RolePayload {
  name: string;
  description?: string;
}

export interface RoleAssignPayload {
  role_id: string;
}

export interface LineManagerPayload {
  user_id: string;
}

export interface DepartmentChangePayload {
  department: string;
}

// ─── Auth types ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
}

// ─── Paginated response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
