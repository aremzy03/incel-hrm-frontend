import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import type {
  AppraisalCycle,
  AppraisalTemplate,
  AppraisalType,
  AppraisalAuditLog,
  EmployeeAppraisalDetail,
  EmployeeAppraisalSummary,
  SelfSubmitPayload,
  SupervisorSubmitPayload,
  AppraiseeSignoffPayload,
  HrCalibratePayload,
  FinalizePayload,
  ReopenPayload,
  CreateCyclePayload,
} from "@/lib/types/appraisal";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const appraisalKeys = {
  all: ["appraisals"] as const,
  myAppraisals: () => ["appraisals", "my"] as const,
  teamAppraisals: () => ["appraisals", "team"] as const,
  allAppraisals: () => ["appraisals", "all"] as const,
  detail: (id: string) => ["appraisals", "detail", id] as const,
  auditLogs: (id: string) => ["appraisals", "audit-logs", id] as const,
  cycles: () => ["appraisal-cycles"] as const,
  cycleDetail: (id: string) => ["appraisal-cycles", id] as const,
  templates: () => ["appraisal-templates"] as const,
  types: () => ["appraisal-types"] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toastOnError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "An unexpected error occurred.";
}

export { toastOnError };

export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if ("results" in data && Array.isArray((data as { results: unknown }).results)) {
      return (data as { results: T[] }).results;
    }
    if ("data" in data && Array.isArray((data as { data: unknown }).data)) {
      return (data as { data: T[] }).data;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Employee — My Appraisals
// ---------------------------------------------------------------------------

export function useMyAppraisals() {
  return useQuery<EmployeeAppraisalSummary[]>({
    queryKey: appraisalKeys.myAppraisals(),
    queryFn: async () => normalizeList<EmployeeAppraisalSummary>(await apiGet("appraisals/my-appraisals/")),
  });
}

// ---------------------------------------------------------------------------
// Supervisor — Team Appraisals
// ---------------------------------------------------------------------------

export function useTeamAppraisals() {
  return useQuery<EmployeeAppraisalSummary[]>({
    queryKey: appraisalKeys.teamAppraisals(),
    queryFn: async () => normalizeList<EmployeeAppraisalSummary>(await apiGet("appraisals/team-appraisals/")),
  });
}

// ---------------------------------------------------------------------------
// HR / Management — All Appraisals
// ---------------------------------------------------------------------------

export function useAllAppraisals() {
  return useQuery<EmployeeAppraisalSummary[]>({
    queryKey: appraisalKeys.allAppraisals(),
    queryFn: async () => normalizeList<EmployeeAppraisalSummary>(await apiGet("appraisals/")),
  });
}

// ---------------------------------------------------------------------------
// Appraisal Detail (all 4 phases)
// ---------------------------------------------------------------------------

export function useAppraisalDetail(id: string) {
  return useQuery<EmployeeAppraisalDetail>({
    queryKey: appraisalKeys.detail(id),
    queryFn: () => apiGet<EmployeeAppraisalDetail>(`appraisals/${id}/`),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export function useAppraisalAuditLogs(id: string) {
  return useQuery<AppraisalAuditLog[]>({
    queryKey: appraisalKeys.auditLogs(id),
    queryFn: async () => normalizeList<AppraisalAuditLog>(await apiGet(`appraisals/${id}/audit-logs/`)),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Employee — Self Submit (Phase 1 & 2)
// ---------------------------------------------------------------------------

export function useSelfSubmit(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, SelfSubmitPayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/self-submit/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.myAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// Supervisor — Supervisor Submit (Phase 2, 3 & 4)
// ---------------------------------------------------------------------------

export function useSupervisorSubmit(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, SupervisorSubmitPayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/supervisor-submit/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.teamAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// Employee — Appraisee Sign-off (Phase 4)
// ---------------------------------------------------------------------------

export function useAppraiseeSignoff(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, AppraiseeSignoffPayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/appraisee-signoff/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.myAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// HR — Calibration
// ---------------------------------------------------------------------------

export function useHrCalibrate(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, HrCalibratePayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/hr-calibrate/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.allAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// Management — Finalize
// ---------------------------------------------------------------------------

export function useFinalizeAppraisal(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, FinalizePayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/finalize/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.allAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// HR — Reopen Override
// ---------------------------------------------------------------------------

export function useReopenAppraisal(appraisalId: string) {
  const qc = useQueryClient();
  return useMutation<EmployeeAppraisalDetail, ApiError, ReopenPayload>({
    mutationFn: (payload) =>
      apiPost<EmployeeAppraisalDetail>(
        `appraisals/${appraisalId}/reopen/`,
        payload
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.detail(appraisalId) });
      qc.invalidateQueries({ queryKey: appraisalKeys.allAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// HR Admin — Cycles
// ---------------------------------------------------------------------------

export function useAppraisalCycles() {
  return useQuery<AppraisalCycle[]>({
    queryKey: appraisalKeys.cycles(),
    queryFn: async () => normalizeList<AppraisalCycle>(await apiGet("appraisal-cycles/")),
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation<
    AppraisalCycle,
    ApiError,
    CreateCyclePayload
  >({
    mutationFn: (payload) =>
      apiPost<AppraisalCycle>("appraisal-cycles/", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.cycles() });
    },
  });
}

export function useActivateCycle() {
  const qc = useQueryClient();
  return useMutation<
    { detail: string; spawned_count: number },
    ApiError,
    string // cycleId
  >({
    mutationFn: (cycleId) =>
      apiPost<{ detail: string; spawned_count: number }>(
        `appraisal-cycles/${cycleId}/activate/`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appraisalKeys.cycles() });
      qc.invalidateQueries({ queryKey: appraisalKeys.allAppraisals() });
    },
  });
}

// ---------------------------------------------------------------------------
// HR Admin — Templates & Types
// ---------------------------------------------------------------------------

export function useAppraisalTemplates() {
  return useQuery<AppraisalTemplate[]>({
    queryKey: appraisalKeys.templates(),
    queryFn: async () => normalizeList<AppraisalTemplate>(await apiGet("appraisal-templates/")),
  });
}

export function useAppraisalTypes() {
  return useQuery<AppraisalType[]>({
    queryKey: appraisalKeys.types(),
    queryFn: async () => normalizeList<AppraisalType>(await apiGet("appraisal-types/")),
  });
}
