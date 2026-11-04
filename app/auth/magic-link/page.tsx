"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  LogOut,
  UserCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getSafeReturnPath } from "@/lib/safeReturnPath";
import { Button } from "@/components/ui/button";
import type {
  MagicLinkExchangeResponse,
  MagicLinkInspectResponse,
} from "@/lib/types/auth";

type LinkStatus =
  | "verifying"
  | "switching"
  | "prompt_switch"
  | "redirecting"
  | "error";

function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();

  const token = searchParams.get("token")?.trim() || "";
  const nextParam = searchParams.get("next");
  const rawEmailParam = searchParams.get("email")?.trim() || "";

  const [status, setStatus] = useState<LinkStatus>("verifying");
  const [targetEmail, setTargetEmail] = useState<string>(rawEmailParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exchangeAttemptedRef = useRef(false);
  const inspectAttemptedRef = useRef(false);

  const redirectToLogin = useCallback(
    (reason: "expired" | "invalid" | "inactive" = "expired", emailToUse?: string) => {
      const email = emailToUse || targetEmail || rawEmailParam;
      const params = new URLSearchParams();
      if (nextParam && nextParam.length <= 1500) {
        params.set("next", nextParam);
      }
      params.set("reason", reason);
      if (email) {
        params.set("email", email);
      }
      router.replace(`/login?${params.toString()}`);
    },
    [nextParam, rawEmailParam, targetEmail, router]
  );

  const executeExchange = useCallback(
    async (emailForFallback?: string): Promise<MagicLinkExchangeResponse | null> => {
      try {
        const res = await fetch("/api/auth/magic-link/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const code = (data?.code || "").toUpperCase();
          if (code === "USER_INACTIVE") {
            redirectToLogin("inactive", emailForFallback);
            return null;
          }
          if (code === "INVALID_TOKEN") {
            redirectToLogin("invalid", emailForFallback);
            return null;
          }
          // Default for 400 Bad Request (TOKEN_EXPIRED, TOKEN_ALREADY_USED, etc.)
          redirectToLogin("expired", emailForFallback);
          return null;
        }

        return data as MagicLinkExchangeResponse;
      } catch {
        redirectToLogin("expired", emailForFallback);
        return null;
      }
    },
    [token, redirectToLogin]
  );

  useEffect(() => {
    // 1. Wait until AuthContext finishes checking current session
    if (authLoading) return;

    // 2. Token must be present
    if (!token) {
      redirectToLogin("invalid");
      return;
    }

    // 3. User is already authenticated
    if (isAuthenticated && user) {
      const currentEmail = (user.email || "").trim().toLowerCase();

      // If email parameter was supplied in the magic link URL
      if (rawEmailParam) {
        const linkEmail = rawEmailParam.trim().toLowerCase();
        if (currentEmail === linkEmail) {
          // Same user already logged in -> navigate directly to next bypassing re-auth
          setStatus("redirecting");
          const destination = getSafeReturnPath(nextParam);
          router.replace(destination);
          return;
        }

        // Different user logged in -> prompt switch account
        setTargetEmail(rawEmailParam);
        setStatus("prompt_switch");
        return;
      }

      // If email parameter was not provided, inspect token non-destructively
      if (!inspectAttemptedRef.current) {
        inspectAttemptedRef.current = true;
        fetch(`/api/auth/magic-link/inspect?token=${encodeURIComponent(token)}`)
          .then(async (res) => {
            if (!res.ok) {
              redirectToLogin("expired");
              return;
            }
            const inspectData: MagicLinkInspectResponse = await res.json();
            if (!inspectData.is_valid || inspectData.is_expired || inspectData.is_consumed) {
              redirectToLogin("expired", inspectData.email);
              return;
            }

            const tokenEmail = (inspectData.email || "").trim().toLowerCase();
            setTargetEmail(inspectData.email);

            if (currentEmail === tokenEmail) {
              // Same user!
              setStatus("redirecting");
              const destination = getSafeReturnPath(
                inspectData.destination_path || nextParam
              );
              router.replace(destination);
            } else {
              // Different user!
              setStatus("prompt_switch");
            }
          })
          .catch(() => {
            redirectToLogin("expired");
          });
      }
      return;
    }

    // 4. No user logged in -> execute token exchange
    if (!exchangeAttemptedRef.current) {
      exchangeAttemptedRef.current = true;
      executeExchange(rawEmailParam).then((res) => {
        if (!res) return;
        login(res.user);
        setStatus("redirecting");
        const destination = getSafeReturnPath(res.destination_path || nextParam);
        router.replace(destination);
      });
    }
  }, [
    authLoading,
    token,
    isAuthenticated,
    user,
    rawEmailParam,
    nextParam,
    router,
    redirectToLogin,
    executeExchange,
    login,
  ]);

  // Handler when user confirms they want to switch to the account in the link
  async function handleSwitchAccount() {
    setStatus("switching");
    setErrorMessage(null);

    // Clear current session without hard-redirecting
    await logout(false);

    const res = await executeExchange(targetEmail);
    if (!res) return;

    login(res.user);
    setStatus("redirecting");
    const destination = getSafeReturnPath(res.destination_path || nextParam);
    router.replace(destination);
  }

  // Handler when user chooses to stay with their current account
  function handleContinueAsCurrent() {
    setStatus("redirecting");
    const destination = getSafeReturnPath(nextParam);
    router.replace(destination);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src="/hrm-logo.png" alt="Incel Group" className="h-12 w-12" />
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">
              Incel Group
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              HR Portal
            </p>
          </div>
        </div>

        {/* State: Prompt Switch Account */}
        {status === "prompt_switch" && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="h-6 w-6" />
            </div>

            <h1 className="text-xl font-semibold text-foreground">
              Switch account?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              You are signed in as{" "}
              <span className="font-medium text-foreground">
                {user?.email}
              </span>
              , but this link is for{" "}
              <span className="font-medium text-primary">
                {targetEmail || "another account"}
              </span>
              .
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full h-10 gap-2 font-medium"
              >
                <LogOut className="h-4 w-4" />
                Switch to {targetEmail || "account in link"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleContinueAsCurrent}
                className="w-full h-10 gap-2 font-medium"
              >
                <UserCheck className="h-4 w-4" />
                Continue as {user?.email}
              </Button>
            </div>

            <div className="mt-6 border-t border-border/60 pt-4 text-center">
              <button
                type="button"
                onClick={() => redirectToLogin("expired")}
                className="text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4"
              >
                Sign in with another password
              </button>
            </div>
          </div>
        )}

        {/* State: Verifying / Switching / Redirecting */}
        {(status === "verifying" ||
          status === "switching" ||
          status === "redirecting") && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {status === "redirecting" ? (
                <CheckCircle2 className="h-6 w-6 animate-pulse text-primary" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
            </div>

            <h2 className="text-base font-semibold text-foreground">
              {status === "verifying" && "Verifying your sign-in link..."}
              {status === "switching" && "Switching your account..."}
              {status === "redirecting" && "Redirecting to your destination..."}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {status === "verifying" &&
                "Please wait while we validate your one-time link."}
              {status === "switching" &&
                "Authenticating the requested account."}
              {status === "redirecting" &&
                "You're all set. Loading your page now."}
            </p>
          </div>
        )}

        {/* State: Error */}
        {status === "error" && (
          <div className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Sign-in link error
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {errorMessage || "Unable to process your sign-in link."}
            </p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => redirectToLogin("expired")}
                className="w-full h-10 gap-2"
              >
                Return to sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MagicLinkFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<MagicLinkFallback />}>
      <MagicLinkHandler />
    </Suspense>
  );
}

