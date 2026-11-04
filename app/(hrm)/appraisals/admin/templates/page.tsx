"use client";

import { Loader2, AlertCircle, Layers, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useAppraisalTemplates } from "@/lib/api/appraisals";

export default function AppraisalTemplatesPage() {
  const { data: rawTemplates, isLoading, error } = useAppraisalTemplates();
  const templates = Array.isArray(rawTemplates)
    ? rawTemplates
    : (rawTemplates as unknown as { results?: typeof rawTemplates })?.results ?? [];
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Template Builder"
        subtitle="View department-specific appraisal templates, sections, and questions."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No templates found. Templates are configured on the backend and linked to departments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const isExpanded = expandedTemplate === template.id;
            return (
              <div
                key={template.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden"
              >
                {/* Template Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedTemplate(isExpanded ? null : template.id)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {template.department_name && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {template.department_name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {template.appraisal_type_name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-foreground">
                      {template.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.sections.length} section
                      {template.sections.length !== 1 ? "s" : ""} ·{" "}
                      {template.sections.reduce(
                        (acc, s) => acc + s.questions.length,
                        0
                      )}{" "}
                      questions total
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Sections */}
                {isExpanded && (
                  <div className="border-t border-outline-variant">
                    {template.sections
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((section) => {
                        const isSectionExpanded = expandedSection === section.id;
                        return (
                          <div
                            key={section.id}
                            className="border-b border-outline-variant/50 last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSection(
                                  isSectionExpanded ? null : section.id
                                )
                              }
                              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/20 transition-colors"
                            >
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-20 shrink-0">
                                {section.section_code}
                              </span>
                              <span className="flex-1 text-sm font-medium text-foreground">
                                {section.title}
                              </span>
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {section.weight}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Scale 1–{section.rating_scale_max}
                              </span>
                              {isSectionExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>

                            {/* Questions */}
                            {isSectionExpanded && (
                              <div className="bg-muted/20 px-5 pb-3">
                                <ol className="space-y-2 pt-2">
                                  {section.questions
                                    .slice()
                                    .sort((a, b) => a.order - b.order)
                                    .map((q, qi) => (
                                      <li key={q.id} className="flex gap-2.5">
                                        <span className="shrink-0 text-xs font-bold text-muted-foreground pt-0.5">
                                          {qi + 1}.
                                        </span>
                                        <div>
                                          <p className="text-xs font-medium text-foreground">
                                            {q.prompt}
                                          </p>
                                          {q.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {q.description}
                                            </p>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
