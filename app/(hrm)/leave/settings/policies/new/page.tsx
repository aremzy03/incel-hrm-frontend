"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PolicyForm, emptyPolicyForm } from "@/components/hrm/leave/PolicyForm";
import { Button } from "@/components/ui/button";
import { SettingsLiveRegion } from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass } from "@/lib/design/field-styles";
import { useCreateLeavePolicy } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { mutationErrorMessage } from "@/lib/leave/settings-labels";

export default function NewLeavePolicyPage() {
  const router = useRouter();
  const { data: types = [] } = useLeaveTypes();
  const create = useCreateLeavePolicy();
  const [form, setForm] = useState(emptyPolicyForm());
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!(form.name ?? "").trim()) {
      setError("Enter a policy name.");
      return;
    }
    if (!form.leave_type) {
      setError("Choose a leave type.");
      return;
    }
    try {
      const created = await create.mutateAsync(form);
      router.push(`/leave/settings/policies/${created.id}`);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not create this draft. Check the fields and try again."));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="New policy draft"
        subtitle="Saves as a draft. Publish from the policy page when the rules are ready."
      />
      <form onSubmit={onSubmit} className={`${stitchCardClass} space-y-6 p-6`}>
        {error ? (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <PolicyForm form={form} setForm={setForm} types={types} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            nativeButton={false}
            render={<Link href="/leave/settings/policies" />}
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            disabled={create.isPending}
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Save draft
          </Button>
        </div>
      </form>
      <SettingsLiveRegion message={create.isPending ? "Saving draft." : ""} />
    </div>
  );
}
