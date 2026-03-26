"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegisterRequest, Department, Gender } from "@/lib/types/auth";

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function PasswordStrength({ password }: { password: string }) {
  const length = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const bars = [
    { threshold: 1, colour: "bg-destructive" },
    { threshold: 2, colour: "bg-chart-4" },
    { threshold: 3, colour: "bg-chart-2" },
    { threshold: 4, colour: "bg-chart-1" },
  ];

  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              score > i ? bar.colour : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span
          className={cn(
            "font-medium",
            score <= 1
              ? "text-destructive"
              : score === 2
              ? "text-chart-4"
              : score === 3
              ? "text-chart-2"
              : "text-chart-1"
          )}
        >
          {labels[score] || ""}
        </span>
      </p>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden bg-primary p-12">
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/5" />
      <div className="absolute -bottom-28 -left-28 h-[360px] w-[360px] rounded-full bg-white/5" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]" />
      <div className="absolute right-20 top-1/3 h-24 w-24 rounded-full bg-white/[0.07]" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M12 3L4 19h16L12 3Z" fill="white" />
            <path d="M12 3L4 19h8V3Z" fill="white" opacity="0.5" />
          </svg>
        </div>
        <div className="leading-none">
          <p className="font-serif font-semibold text-lg text-white">Incel Group</p>
          <p className="text-[10px] uppercase tracking-widest text-white/60">HR Portal</p>
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <h2 className="font-serif text-[2.5rem] font-semibold leading-snug text-white">
          Join your team&apos;s
          <br />
          HR workspace.
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-white/70">
          Create your account to access leave management, payroll, appraisals,
          and everything HR — all in one place.
        </p>

        <ul className="space-y-3 pt-2">
          {[
            "Apply and track leave in seconds",
            "View your payslips anytime",
            "Request loans and appraisals online",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white/60" />
              <span className="text-sm text-white/75">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        &copy; {new Date().getFullYear()} Incel Group. All rights reserved.
      </p>
    </div>
  );
}

async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch("/api/departments");
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

async function registerFn(payload: RegisterRequest) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.email?.[0] ||
          data?.password?.[0] ||
          data?.password_confirm?.[0] ||
          data?.department?.[0] ||
          data?.gender?.[0] ||
          data?.date_of_birth?.[0] ||
          "Registration failed. Please try again.";
    throw new Error(message);
  }
  return data;
}

export default function RegisterPage() {
  const uid = useId();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    gender: "" as "" | "MALE" | "FEMALE",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form | "form", string>>
  >({});
  const [success, setSuccess] = useState(false);

  const { data: departments = [], isLoading: deptLoading } = useQuery({
    queryKey: ["public-departments"],
    queryFn: fetchDepartments,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: registerFn,
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => {
      setErrors({ form: err.message });
    },
  });

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.department) errs.department = "Please select a department.";
    if (!form.gender) errs.gender = "Please select your gender.";
    if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    mutation.mutate({
      email: form.email.trim(),
      password: form.password,
      password_confirm: form.confirmPassword,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      gender: form.gender as Gender,
      date_of_birth: form.dateOfBirth,
      department: form.department || undefined,
    });
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Account created!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your request has been submitted. Your HR admin will review and activate
            your account. You&apos;ll receive a confirmation email shortly.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Back to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M12 3L4 19h16L12 3Z" fill="white" />
                <path d="M12 3L4 19h8V3Z" fill="white" opacity="0.5" />
              </svg>
            </div>
            <span className="font-serif font-semibold text-base text-foreground">
              Incel Group
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details to request access to the HR Portal.
          </p>

          {errors.form && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${uid}-fname`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  First name
                </label>
                <input
                  id={`${uid}-fname`}
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Amina"
                  autoComplete="given-name"
                  className={cn(
                    fieldClass,
                    errors.firstName && "border-destructive focus:ring-destructive/30"
                  )}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${uid}-lname`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Last name
                </label>
                <input
                  id={`${uid}-lname`}
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Yusuf"
                  autoComplete="family-name"
                  className={cn(
                    fieldClass,
                    errors.lastName && "border-destructive focus:ring-destructive/30"
                  )}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor={`${uid}-email`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Work email
              </label>
              <input
                id={`${uid}-email`}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="amina@organisation.com"
                autoComplete="email"
                className={cn(
                  fieldClass,
                  errors.email && "border-destructive focus:ring-destructive/30"
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor={`${uid}-dept`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Department
              </label>
              <div className="relative">
                <select
                  id={`${uid}-dept`}
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  disabled={deptLoading}
                  className={cn(
                    fieldClass,
                    "appearance-none cursor-pointer",
                    errors.department && "border-destructive focus:ring-destructive/30",
                    deptLoading && "cursor-not-allowed opacity-60"
                  )}
                >
                  <option value="">
                    {deptLoading ? "Loading departments..." : "Select your department"}
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {deptLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
                )}
              </div>
              {errors.department && (
                <p className="mt-1 text-xs text-destructive">{errors.department}</p>
              )}
            </div>

            {/* Gender & Date of birth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${uid}-gender`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Gender
                </label>
                <select
                  id={`${uid}-gender`}
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value as "" | "MALE" | "FEMALE")}
                  className={cn(
                    fieldClass,
                    "appearance-none cursor-pointer",
                    errors.gender && "border-destructive focus:ring-destructive/30"
                  )}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-destructive">{errors.gender}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor={`${uid}-dob`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Date of birth
                </label>
                <input
                  id={`${uid}-dob`}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                  min="1920-01-01"
                  max={new Date().toISOString().slice(0, 10)}
                  className={cn(
                    fieldClass,
                    errors.dateOfBirth && "border-destructive focus:ring-destructive/30"
                  )}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-destructive">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor={`${uid}-password`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id={`${uid}-password`}
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={cn(
                    fieldClass,
                    "pr-11",
                    errors.password && "border-destructive focus:ring-destructive/30"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              ) : (
                <PasswordStrength password={form.password} />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor={`${uid}-confirm`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id={`${uid}-confirm`}
                  type={showConfirmPwd ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={cn(
                    fieldClass,
                    "pr-11",
                    errors.confirmPassword &&
                      "border-destructive focus:ring-destructive/30"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {showConfirmPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
