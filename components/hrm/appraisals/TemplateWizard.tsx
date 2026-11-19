"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useDepartments } from "@/lib/api/departments";
import { useTeams } from "@/lib/api/teams";
import { useUnits } from "@/lib/api/units";
import {
  appraisalKeys,
  useAppraisalTemplate,
  useAppraisalTypes,
  useCreateTemplate,
  useTemplateVersions,
  useUpdateTemplate,
} from "@/lib/api/appraisals";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import type {
  AppraisalSection,
  SectionAudience,
  SectionKind,
  TemplatePhaseDraft,
  TemplateQuestionDraft,
  TemplateScope,
  TemplateSectionDraft,
  TemplateWritePayload,
} from "@/lib/types/appraisal";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";

const STEPS = ["Details", "Assignment", "Phases", "Review"] as const;

const AUDIENCES: { value: SectionAudience; label: string }[] = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "BOTH", label: "Employee and supervisor" },
  { value: "HR", label: "HR" },
  { value: "MANAGEMENT", label: "Management" },
];

function blankQuestion(kind: SectionKind): TemplateQuestionDraft {
  if (kind === "CHECKBOX") {
    return {
      prompt: "",
      description: "",
      response_type: "MULTI_SELECT",
      counts_toward_score: false,
      required: false,
      weight: null,
      options: [],
    };
  }
  if (kind === "NARRATIVE") {
    return {
      prompt: "",
      description: "",
      response_type: "LONG_TEXT",
      counts_toward_score: false,
      required: false,
      weight: null,
      options: [],
    };
  }
  return {
    prompt: "",
    description: "",
    response_type: "RATING",
    counts_toward_score: kind === "SCORED" || kind === "INFORMATIONAL_RATING",
    required: kind === "SCORED" || kind === "INFORMATIONAL_RATING",
    weight: kind === "SCORED" || kind === "INFORMATIONAL_RATING" ? "100" : null,
    options: [],
  };
}

function blankSection(): TemplateSectionDraft {
  return {
    title: "",
    section_code: "",
    kind: "NARRATIVE",
    audience: "EMPLOYEE",
    weight: "0",
    rating_scale_max: 5,
    questions: [blankQuestion("NARRATIVE")],
  };
}

function sectionFromApi(section: AppraisalSection): TemplateSectionDraft {
  return {
    title: section.title,
    section_code: section.section_code ?? "",
    kind: section.kind ?? "NARRATIVE",
    audience: section.audience ?? "EMPLOYEE",
    weight: section.weight ?? "0",
    rating_scale_max: section.rating_scale_max ?? 5,
    questions: section.questions.map((question) => ({
      prompt: question.prompt,
      description: question.description ?? "",
      response_type: question.response_type ?? "LONG_TEXT",
      counts_toward_score: Boolean(question.counts_toward_score),
      required: Boolean(question.required),
      weight: question.weight ?? null,
      options: question.options ?? [],
    })),
  };
}

function blankPhase(): TemplatePhaseDraft {
  return { title: "", sections: [blankSection()] };
}

function phasesFromSource(source?: { phases?: { title: string; sections: AppraisalSection[] }[]; sections?: AppraisalSection[] } | null) {
  if (source?.phases?.length) {
    return source.phases.map((phase) => ({
      title: phase.title,
      sections: phase.sections.map(sectionFromApi),
    }));
  }
  if (source?.sections?.length) {
    return [{ title: "Phase 1", sections: source.sections.map(sectionFromApi) }];
  }
  return [blankPhase()];
}

function weightTotal(values: Array<string | null | undefined>) {
  return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function targetLabel(scope: TemplateScope, departmentName: string, unitName: string, teamName: string) {
  if (scope === "ORG") return "Organization-wide";
  if (scope === "DEPARTMENT") return departmentName || "Department";
  if (scope === "UNIT") return unitName || "Unit";
  if (scope === "TEAM") return teamName || "Team";
  return "Not assigned";
}

export function TemplateWizard({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useAppraisalTemplate(templateId ?? "");
  const { data: rawTypes } = useAppraisalTypes();
  const types = Array.isArray(rawTypes)
    ? rawTypes
    : ((rawTypes as unknown as { results?: typeof rawTypes })?.results ?? []);
  const { data: departmentPage } = useDepartments();
  const departments = departmentPage?.results ?? [];

  const [step, setStep] = useState(0);
  const [activeId, setActiveId] = useState(templateId ?? "");
  const [hydrated, setHydrated] = useState(!templateId);
  const [showHistory, setShowHistory] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appraisalType, setAppraisalType] = useState("");
  const [scope, setScope] = useState<TemplateScope>("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [phases, setPhases] = useState<TemplatePhaseDraft[]>([blankPhase()]);

  const { data: units = [] } = useUnits(departmentId);
  const { data: teams = [] } = useTeams(unitId);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(activeId || templateId || "new");
  const { data: versions = [] } = useTemplateVersions(activeId || templateId || "");

  const locked = Boolean(existing?.assignment_locked);
  const departmentName = departments.find((item) => item.id === departmentId)?.name ?? existing?.department_name ?? "";
  const unitName = units.find((item) => item.id === unitId)?.name ?? existing?.unit_name ?? "";
  const teamName = teams.find((item) => item.id === teamId)?.name ?? existing?.team_name ?? "";

  useEffect(() => {
    if (!existing || hydrated) return;
    const source = existing.draft ?? existing.published;
    setTitle(existing.title ?? "");
    setDescription(existing.description ?? "");
    setAppraisalType(existing.appraisal_type ?? "");
    setScope(existing.scope ?? "");
    setDepartmentId(existing.department ?? "");
    setUnitId(existing.unit ?? "");
    setTeamId(existing.team ?? "");
    setPhases(phasesFromSource(source));
    setHydrated(true);
  }, [existing, hydrated]);

  function payload(): TemplateWritePayload {
    return {
      title,
      description,
      appraisal_type: appraisalType,
      scope,
      department: scope === "DEPARTMENT" || scope === "UNIT" || scope === "TEAM" ? departmentId || null : null,
      unit: scope === "UNIT" || scope === "TEAM" ? unitId || null : null,
      team: scope === "TEAM" ? teamId || null : null,
      phases: phases.map((phase, phaseIndex) => ({
        title: phase.title,
        order: phaseIndex + 1,
        sections: phase.sections.map((section, index) => ({
          ...section,
          order: index + 1,
          weight: section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING" ? section.weight || "0" : "0",
          questions: section.questions.map((question, questionIndex) => ({
            ...question,
            order: questionIndex + 1,
            response_type: section.kind === "CHECKBOX" ? "MULTI_SELECT" : question.response_type,
            counts_toward_score:
              section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING"
                ? question.counts_toward_score
                : false,
            weight:
              (section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING") && question.counts_toward_score
                ? question.weight
                : null,
            options:
              section.kind === "CHECKBOX" || question.response_type === "MULTI_SELECT" ? question.options : [],
          })),
        })),
      })),
    };
  }

  async function persist() {
    const body = payload();
    const id = activeId || templateId;
    if (!id) {
      const created = await createTemplate.mutateAsync(body);
      setActiveId(created.id);
      router.replace(`/appraisals/admin/templates/${created.id}`);
      return created.id;
    }
    await updateTemplate.mutateAsync(body);
    return id;
  }

  async function saveDraft() {
    try {
      await persist();
      toast.success("Draft saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the draft.");
    }
  }

  async function publish() {
    try {
      const id = await persist();
      await apiPost(`appraisal-templates/${id}/publish/`);
      await qc.invalidateQueries({ queryKey: appraisalKeys.template(id) });
      await qc.invalidateQueries({ queryKey: appraisalKeys.templates() });
      await qc.invalidateQueries({ queryKey: appraisalKeys.templateVersions(id) });
      toast.success("Template published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish the template.");
    }
  }

  function updatePhase(phaseIndex: number, patch: Partial<TemplatePhaseDraft>) {
    setPhases((current) =>
      current.map((phase, index) => (index === phaseIndex ? { ...phase, ...patch } : phase))
    );
  }

  function updateSection(phaseIndex: number, sectionIndex: number, patch: Partial<TemplateSectionDraft>) {
    setPhases((current) =>
      current.map((phase, index) => {
        if (index !== phaseIndex) return phase;
        return {
          ...phase,
          sections: phase.sections.map((section, itemIndex) => {
            if (itemIndex !== sectionIndex) return section;
            const next = { ...section, ...patch };
            if (patch.kind && patch.kind !== section.kind) {
              next.questions = [blankQuestion(patch.kind)];
              next.questions[0] = { ...blankQuestion(patch.kind), prompt: section.questions[0]?.prompt ?? "" };
            }
            return next;
          }),
        };
      })
    );
  }

  function updateQuestion(
    phaseIndex: number,
    sectionIndex: number,
    questionIndex: number,
    patch: Partial<TemplateQuestionDraft>
  ) {
    setPhases((current) =>
      current.map((phase, index) => {
        if (index !== phaseIndex) return phase;
        return {
          ...phase,
          sections: phase.sections.map((section, itemIndex) => {
            if (itemIndex !== sectionIndex) return section;
            return {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex ? { ...question, ...patch } : question
              ),
            };
          }),
        };
      })
    );
  }

  function movePhase(phaseIndex: number, direction: -1 | 1) {
    setPhases((current) => {
      const next = [...current];
      const target = phaseIndex + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(phaseIndex, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function moveSection(phaseIndex: number, sectionIndex: number, direction: -1 | 1) {
    setPhases((current) =>
      current.map((phase, index) => {
        if (index !== phaseIndex) return phase;
        const sections = [...phase.sections];
        const target = sectionIndex + direction;
        if (target < 0 || target >= sections.length) return phase;
        const [item] = sections.splice(sectionIndex, 1);
        sections.splice(target, 0, item);
        return { ...phase, sections };
      })
    );
  }

  const scoredTotal = weightTotal(
    phases.flatMap((phase) => phase.sections.filter((section) => section.kind === "SCORED").map((section) => section.weight))
  );
  const saving = createTemplate.isPending || updateTemplate.isPending;

  if (templateId && (isLoading || !hydrated)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={templateId ? "Edit template" : "New appraisal template"}
        subtitle="Build the form, assign who it is for, then publish it for the next cycle."
        action={
          activeId || templateId ? (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory((open) => !open)}>
              Version history
            </Button>
          ) : null
        }
      />

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                step === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {showHistory && (
        <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h2 className="text-sm font-bold">Published versions</h2>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            versions.map((version) => (
              <details key={version.id} className="rounded-lg border border-outline-variant p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Version {version.version_number} · {version.status}
                </summary>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {(version.phases?.length
                    ? version.phases
                    : [{ id: version.id, title: "Phase 1", order: 1, sections: version.sections }]
                  ).map((phase) => (
                    <li key={phase.id}>
                      <p className="font-medium text-foreground">{phase.title || "Untitled phase"}</p>
                      <ul className="mt-1 space-y-1 pl-4">
                        {phase.sections.map((section) => (
                          <li key={section.id}>
                            {section.title} · {section.kind} · {section.questions.length} questions
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </details>
            ))
          )}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <label className="block space-y-1 text-xs font-semibold">
            Title
            <input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            Appraisal type
            <select
              className={fieldClass}
              value={appraisalType}
              disabled={locked}
              onChange={(event) => setAppraisalType(event.target.value)}
            >
              <option value="">Select type…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            Description
            <textarea
              className={fieldClass}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <label className="block space-y-1 text-xs font-semibold">
            Who is this template for?
            <select
              className={fieldClass}
              value={scope}
              disabled={locked}
              onChange={(event) => setScope(event.target.value as TemplateScope)}
            >
              <option value="">Choose a target…</option>
              <option value="ORG">Organization-wide default</option>
              <option value="DEPARTMENT">A department</option>
              <option value="UNIT">A unit</option>
              <option value="TEAM">A team</option>
            </select>
          </label>
          {scope !== "" && scope !== "ORG" && (
            <label className="block space-y-1 text-xs font-semibold">
              Department
              <select
                className={fieldClass}
                value={departmentId}
                disabled={locked}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setUnitId("");
                  setTeamId("");
                }}
              >
                <option value="">Select department…</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(scope === "UNIT" || scope === "TEAM") && (
            <label className="block space-y-1 text-xs font-semibold">
              Unit
              <select
                className={fieldClass}
                value={unitId}
                disabled={locked || !departmentId}
                onChange={(event) => {
                  setUnitId(event.target.value);
                  setTeamId("");
                }}
              >
                <option value="">Select unit…</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scope === "TEAM" && (
            <label className="block space-y-1 text-xs font-semibold">
              Team
              <select
                className={fieldClass}
                value={teamId}
                disabled={locked || !unitId}
                onChange={(event) => setTeamId(event.target.value)}
              >
                <option value="">Select team…</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {locked && (
            <p className="text-xs text-muted-foreground">
              This template has been published, so its type and assignment stay fixed. Duplicate it to cover a different group.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scored section weights: {scoredTotal.toFixed(2)} / 100
          </p>
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">Phase {phaseIndex + 1}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => movePhase(phaseIndex, -1)} aria-label="Move phase up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => movePhase(phaseIndex, 1)} aria-label="Move phase down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhases((current) => current.filter((_, itemIndex) => itemIndex !== phaseIndex))}
                    aria-label="Remove phase"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input
                className={fieldClass}
                placeholder="Phase title"
                value={phase.title}
                onChange={(event) => updatePhase(phaseIndex, { title: event.target.value })}
              />
              {phase.sections.map((section, index) => {
            const counting = section.questions.filter((question) => question.counts_toward_score);
            const questionTotal = weightTotal(counting.map((question) => question.weight));
            return (
              <div key={index} className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">Section {index + 1}</p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveSection(phaseIndex, index, -1)} aria-label="Move section up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveSection(phaseIndex, index, 1)} aria-label="Move section down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updatePhase(phaseIndex, {
                          sections: phase.sections.filter((_, itemIndex) => itemIndex !== index),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <input
                  className={fieldClass}
                  placeholder="Section title"
                  value={section.title}
                  onChange={(event) => updateSection(phaseIndex, index, { title: event.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className={fieldClass}
                    value={section.kind}
                    onChange={(event) => updateSection(phaseIndex, index, { kind: event.target.value as SectionKind })}
                  >
                    <option value="NARRATIVE">Narrative</option>
                    <option value="SCORED">Scored ratings</option>
                    <option value="INFORMATIONAL_RATING">Informational ratings</option>
                    <option value="CHECKBOX">Checkboxes</option>
                  </select>
                  <select
                    className={fieldClass}
                    value={section.audience}
                    onChange={(event) => updateSection(phaseIndex, index, { audience: event.target.value as SectionAudience })}
                  >
                    {AUDIENCES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {(section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING") && (
                    <>
                      <label className="space-y-1 text-xs font-semibold">
                        Section weight
                        <input
                          className={fieldClass}
                          type="number"
                          min={0}
                          max={100}
                          value={section.weight}
                          onChange={(event) => updateSection(phaseIndex, index, { weight: event.target.value })}
                        />
                      </label>
                      <label className="space-y-1 text-xs font-semibold">
                        Scale max
                        <input
                          className={fieldClass}
                          type="number"
                          min={1}
                          max={10}
                          value={section.rating_scale_max}
                          onChange={(event) => updateSection(phaseIndex, index, { rating_scale_max: Number(event.target.value) })}
                        />
                      </label>
                    </>
                  )}
                </div>
                {section.kind === "CHECKBOX" && (
                  <p className="text-xs text-muted-foreground">
                    People can tick as many options as they want. These answers are not scored.
                  </p>
                )}
                {(section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING") && (
                  <p className="text-xs text-muted-foreground">
                    Scoring question weights: {questionTotal.toFixed(2)} / 100
                    {section.audience === "BOTH"
                      ? ". Employee and supervisor scores stay separate and do not change the official score."
                      : ""}
                  </p>
                )}
                {section.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-2 rounded-lg border border-outline-variant p-3">
                    <textarea
                      className={fieldClass}
                      rows={2}
                      placeholder="Question prompt"
                      value={question.prompt}
                      onChange={(event) => updateQuestion(phaseIndex, index, questionIndex, { prompt: event.target.value })}
                    />
                    {section.kind === "NARRATIVE" && (
                      <select
                        className={fieldClass}
                        value={question.response_type}
                        onChange={(event) =>
                          updateQuestion(phaseIndex, index, questionIndex, {
                            response_type: event.target.value as TemplateQuestionDraft["response_type"],
                          })
                        }
                      >
                        <option value="SHORT_TEXT">Short text</option>
                        <option value="LONG_TEXT">Long text</option>
                        <option value="YES_NO">Yes / no</option>
                        <option value="MULTI_SELECT">Multi-select</option>
                      </select>
                    )}
                    {(section.kind === "CHECKBOX" || question.response_type === "MULTI_SELECT") && (
                      <textarea
                        className={fieldClass}
                        rows={3}
                        placeholder="One option per line"
                        value={question.options.join("\n")}
                        onChange={(event) =>
                          updateQuestion(phaseIndex, index, questionIndex, {
                            options: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                          })
                        }
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) => updateQuestion(phaseIndex, index, questionIndex, { required: event.target.checked })}
                        />
                        Required
                      </label>
                      {(section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING") && (
                        <>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={question.counts_toward_score}
                              onChange={(event) =>
                                updateQuestion(phaseIndex, index, questionIndex, {
                                  counts_toward_score: event.target.checked,
                                  weight: event.target.checked ? question.weight ?? "0" : null,
                                })
                              }
                            />
                            Counts toward official score
                          </label>
                          {question.counts_toward_score && (
                            <input
                              className="w-24 rounded-lg border border-outline-variant px-2 py-1"
                              type="number"
                              min={0}
                              max={100}
                              value={question.weight ?? ""}
                              onChange={(event) => updateQuestion(phaseIndex, index, questionIndex, { weight: event.target.value })}
                            />
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        className="text-destructive"
                        onClick={() =>
                          updateSection(phaseIndex, index, {
                            questions: section.questions.filter((_, itemIndex) => itemIndex !== questionIndex),
                          })
                        }
                      >
                        Remove question
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateSection(phaseIndex, index, { questions: [...section.questions, blankQuestion(section.kind)] })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add question
                </Button>
              </div>
            );
          })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  updatePhase(phaseIndex, { sections: [...phase.sections, blankSection()] })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add section
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setPhases((current) => [...current, blankPhase()])}>
            <Plus className="mr-1 h-4 w-4" />
            Add phase
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-sm">
          <p><span className="font-semibold">Title:</span> {title || "Untitled"}</p>
          <p><span className="font-semibold">Assignment:</span> {targetLabel(scope, departmentName, unitName, teamName)}</p>
          <p><span className="font-semibold">Phases:</span> {phases.length}</p>
          <p><span className="font-semibold">Scored weight:</span> {scoredTotal.toFixed(2)} / 100</p>
          <ul className="space-y-3 text-muted-foreground">
            {phases.map((phase, phaseIndex) => (
              <li key={phaseIndex}>
                <p className="font-medium text-foreground">{phase.title || `Phase ${phaseIndex + 1}`}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {phase.sections.map((section, index) => (
                    <li key={index}>
                      {section.title || "Untitled"} · {section.kind} · {section.audience} · {section.questions.length} questions
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={saving || !title || !appraisalType} onClick={saveDraft}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save draft
          </Button>
          {step < 3 ? (
            <Button type="button" size="sm" className="rounded-full px-5" onClick={() => setStep((current) => current + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="button" size="sm" className="rounded-full px-5" disabled={saving || !title || !appraisalType} onClick={publish}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
