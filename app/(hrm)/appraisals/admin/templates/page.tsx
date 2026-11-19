"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Layers, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppraisalTemplates, useDuplicateTemplate } from "@/lib/api/appraisals";
import { toast } from "@/lib/toast";
import type { TemplateScope } from "@/lib/types/appraisal";

function targetName(template: {
  scope: TemplateScope;
  department_name: string | null;
  unit_name: string | null;
  team_name: string | null;
}) {
  if (template.scope === "ORG") return "Organization-wide";
  if (template.scope === "TEAM") return template.team_name || "Team";
  if (template.scope === "UNIT") return template.unit_name || "Unit";
  if (template.scope === "DEPARTMENT") return template.department_name || "Department";
  return "Unassigned";
}

export default function AppraisalTemplatesPage() {
  const router = useRouter();
  const { data: templates = [], isLoading, error } = useAppraisalTemplates();
  const duplicate = useDuplicateTemplate();

  async function copyTemplate(id: string) {
    try {
      const copy = await duplicate.mutateAsync(id);
      toast.success("Template duplicated. Choose a new assignment before publishing.");
      router.push(`/appraisals/admin/templates/${copy.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not duplicate the template.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Template Builder"
        subtitle="Create an appraisal form and assign it to the organization, a department, a unit, or a team."
        action={
          <Link href="/appraisals/admin/templates/new" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-5")}>
            <Plus className="mr-1.5 h-4 w-4" />
            New template
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No templates yet. Start with a blank form.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-4"
            >
              <div>
                <p className="text-sm font-bold">{template.title}</p>
                <p className="text-xs text-muted-foreground">
                  {template.appraisal_type_name} · {targetName(template)}
                  {template.published_version_number
                    ? ` · Published v${template.published_version_number}`
                    : " · Not published"}
                  {template.has_draft ? " · Draft in progress" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} onClick={() => copyTemplate(template.id)}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Duplicate
                </button>
                <Link href={`/appraisals/admin/templates/${template.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
