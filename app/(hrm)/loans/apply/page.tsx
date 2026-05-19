"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useLoanTypes, useCreateLoanApplication } from "@/lib/api/loans";
import { usePersonnel } from "@/lib/api/personnel";
import { useAuth } from "@/contexts/AuthContext";
import { getLoanApiErrorMessage } from "@/lib/loans/errors";
import { ApiError } from "@/lib/api-client";

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function ApplyForLoanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: loanTypes = [], isLoading: typesLoading } = useLoanTypes();
  const { data: personnel, isLoading: personnelLoading } = usePersonnel(
    user?.id ?? ""
  );
  const createMutation = useCreateLoanApplication();

  const [loanTypeId, setLoanTypeId] = useState("");
  const [amount, setAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("6");
  const [purpose, setPurpose] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const notConfirmed =
    personnel && personnel.confirmation_status !== "CONFIRMED";

  const isLoading = typesLoading || personnelLoading;

  function validate(): string | null {
    if (!loanTypeId) return "Please select a loan type.";
    const amt = parseFloat(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      return "Amount must be greater than zero.";
    }
    const tenure = parseInt(tenureMonths, 10);
    if (Number.isNaN(tenure) || tenure < 1 || tenure > 12) {
      return "Tenure must be between 1 and 12 months.";
    }
    if (!purpose.trim()) return "Please enter the purpose of the loan.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setClientError(null);

    try {
      const created = await createMutation.mutateAsync({
        loan_type: loanTypeId,
        amount: parseFloat(amount).toFixed(2),
        tenure_months: parseInt(tenureMonths, 10),
        purpose: purpose.trim(),
      });
      router.push(`/loans/requests/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setApiError(err.message);
      } else {
        setApiError(
          getLoanApiErrorMessage(err, "Could not create loan application.")
        );
      }
    }
  }

  const submitDisabled =
    createMutation.isPending || notConfirmed === true || isLoading;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/loans" className="text-primary hover:underline">
          Staff Loans
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Apply for loan</span>
      </nav>

      <PageHeader
        title="Apply for loan"
        subtitle="Submit a new loan application. It will be saved as a draft until you submit it for approval."
      />

      {notConfirmed && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Only confirmed staff can apply for loans. Your confirmation status
            must be updated by HR before you can proceed.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-5 rounded-2xl border border-border/90 bg-card p-6 shadow-sm"
        >
          <div>
            <label htmlFor="loan-type" className="mb-1.5 block text-sm font-medium">
              Loan type
            </label>
            <select
              id="loan-type"
              value={loanTypeId}
              onChange={(e) => setLoanTypeId(e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">Select type…</option>
              {loanTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
              Amount (NGN)
            </label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass}
              placeholder="e.g. 50000"
              required
            />
          </div>

          <div>
            <label htmlFor="tenure" className="mb-1.5 block text-sm font-medium">
              Tenure (months)
            </label>
            <input
              id="tenure"
              type="number"
              min={1}
              max={12}
              value={tenureMonths}
              onChange={(e) => setTenureMonths(e.target.value)}
              className={fieldClass}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">1–12 months</p>
          </div>

          <div>
            <label htmlFor="purpose" className="mb-1.5 block text-sm font-medium">
              Purpose
            </label>
            <textarea
              id="purpose"
              rows={4}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={fieldClass}
              placeholder="Describe why you need this loan…"
              required
            />
          </div>

          {(clientError || apiError) && (
            <p className="text-sm text-destructive" role="alert">
              {clientError ?? apiError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitDisabled}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create draft application
            </Button>
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href="/loans" />}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
