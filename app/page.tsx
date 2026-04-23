"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginRequest, AuthResponse } from "@/lib/types/auth";

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden bg-primary p-12">
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/5" />
      <div className="absolute -bottom-28 -left-28 h-[360px] w-[360px] rounded-full bg-white/5" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]" />
      <div className="absolute right-20 top-1/3 h-24 w-24 rounded-full bg-white/[0.07]" />

      <div className="relative z-10 flex items-center gap-3">
        <img
          src="/hrm logo.png"
          alt="HRM logo"
          className="h-12 w-12"
        />
        <div className="leading-none">
          <p className="font-serif font-semibold text-lg text-white">Incel Group</p>
          <p className="text-[10px] uppercase tracking-widest text-white/60">HR Portal</p>
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <h2 className="font-serif text-[2.5rem] font-semibold leading-snug text-white">
          Manage your people,
          <br />
          not your paperwork.
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-white/70">
          A unified platform for leave management, appraisals, staff loans, and
          more — built for growing organisations.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {["Leave Management", "Staff Appraisals", "Loan Tracking"].map((f) => (
            <span
              key={f}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        &copy; {new Date().getFullYear()} Incel Group. All rights reserved.
      </p>
    </div>
  );
}

async function loginFn(payload: LoginRequest): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.email?.[0] || data?.password?.[0] || "Login failed. Please check your credentials.";
    throw new Error(message);
  }
  return data;
}

export default function LoginPage() {
  const uid = useId();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      login(data.user);
      router.push("/leave");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Both fields are required.");
      return;
    }
    setError(null);
    mutation.mutate({ email: email.trim(), password });
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img
              src="/hrm logo.png"
              alt="HRM logo"
              className="h-12 w-12"
            />
            <span className="font-serif font-semibold text-base text-foreground">
              Incel Group
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your HR Portal account.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor={`${uid}-email`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id={`${uid}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.com"
                autoComplete="email"
                className={fieldClass}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={`${uid}-password`}
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id={`${uid}-password`}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(fieldClass, "pr-11")}
                  required
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
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
