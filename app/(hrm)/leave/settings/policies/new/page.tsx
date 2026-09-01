"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PolicyForm, emptyPolicyForm } from "@/components/hrm/leave/PolicyForm";
import { stitchCardClass } from "@/lib/design/field-styles";
import { useCreateLeavePolicy } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";

export default function NewLeavePolicyPage() {
  const router = useRouter();
  const { data: types = [] } = useLeaveTypes();
  const create = useCreateLeavePolicy();
  const [form, setForm] = useState(emptyPolicyForm());
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await create.mutateAsync(form);
      router.push(`/leave/settings/policies/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create draft.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New policy draft" subtitle="Creates a DRAFT. Publish from the policy page when ready." />
      <form onSubmit={onSubmit} className={`${stitchCardClass} space-y-6 p-6`}>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <PolicyForm form={form} setForm={setForm} types={types} />
        <button type="submit" disabled={create.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Save draft
        </button>
      </form>
    </div>
  );
}
