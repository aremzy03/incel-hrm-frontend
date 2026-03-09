export interface Role {
  id: string;
  name: "EMPLOYEE" | "LINE_MANAGER" | "HR" | "EXECUTIVE_DIRECTOR" | "MANAGING_DIRECTOR";
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  roles: string[];
  date_joined: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
}
