"use client";

import { useParams } from "next/navigation";
import { TemplateWizard } from "@/components/hrm/appraisals/TemplateWizard";

export default function EditAppraisalTemplatePage() {
  const { id } = useParams<{ id: string }>();
  return <TemplateWizard templateId={id} />;
}
