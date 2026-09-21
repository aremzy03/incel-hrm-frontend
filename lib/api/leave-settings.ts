import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { asList } from "@/lib/api/leave-helpers";
import type {
  ApproverDelegate,
  HolidayCalendar,
  HolidayCalendarItem,
  LeaveBlackoutPeriod,
  LeaveCalendarAssignment,
  LeaveSettings,
  LeaveWorkflowTemplate,
  PaginatedResponse,
  WorkflowSimulateResponse,
  WorkingCalendar,
} from "@/lib/types/leave";

export function useLeaveSettings() {
  return useQuery<LeaveSettings>({
    queryKey: ["leave-settings"],
    queryFn: () => apiGet<LeaveSettings>("leave-settings"),
  });
}

export function usePatchLeaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveSettings> & { reason?: string }) =>
      apiPatch<LeaveSettings>("leave-settings", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-settings"] }),
  });
}

export function useWorkingCalendars() {
  return useQuery<WorkingCalendar[]>({
    queryKey: ["working-calendars"],
    queryFn: async () => {
      const data = await apiGet<WorkingCalendar[] | PaginatedResponse<WorkingCalendar>>(
        "working-calendars"
      );
      return asList(data);
    },
  });
}

export function useCreateWorkingCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<WorkingCalendar> & { reason?: string }) =>
      apiPost<WorkingCalendar>("working-calendars", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["working-calendars"] }),
  });
}

export function useUpdateWorkingCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<WorkingCalendar> & { reason?: string };
    }) => apiPatch<WorkingCalendar>(`working-calendars/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["working-calendars"] }),
  });
}

export function useDeleteWorkingCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`working-calendars/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["working-calendars"] }),
  });
}

export function useHolidayCalendars() {
  return useQuery<HolidayCalendar[]>({
    queryKey: ["holiday-calendars"],
    queryFn: async () => {
      const data = await apiGet<HolidayCalendar[] | PaginatedResponse<HolidayCalendar>>(
        "holiday-calendars"
      );
      return asList(data);
    },
  });
}

export function useCreateHolidayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<HolidayCalendar> & { reason?: string }) =>
      apiPost<HolidayCalendar>("holiday-calendars", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday-calendars"] }),
  });
}

export function useUpdateHolidayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<HolidayCalendar> & { reason?: string };
    }) => apiPatch<HolidayCalendar>(`holiday-calendars/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday-calendars"] }),
  });
}

export function useDeleteHolidayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`holiday-calendars/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday-calendars"] }),
  });
}

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      calendarId,
      payload,
    }: {
      calendarId: string;
      payload: Partial<HolidayCalendarItem> & { reason?: string };
    }) =>
      apiPost<HolidayCalendarItem>(`holiday-calendars/${calendarId}/holidays/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday-calendars"] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ calendarId, holidayId }: { calendarId: string; holidayId: string }) =>
      apiDelete<void>(`holiday-calendars/${calendarId}/holidays/${holidayId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday-calendars"] }),
  });
}

export function useCalendarAssignments() {
  return useQuery<LeaveCalendarAssignment[]>({
    queryKey: ["leave-calendar-assignments"],
    queryFn: async () => {
      const data = await apiGet<
        LeaveCalendarAssignment[] | PaginatedResponse<LeaveCalendarAssignment>
      >("leave-calendar-assignments");
      return asList(data);
    },
  });
}

export function useCreateCalendarAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveCalendarAssignment> & { reason?: string }) =>
      apiPost<LeaveCalendarAssignment>("leave-calendar-assignments", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-calendar-assignments"] }),
  });
}

export function useDeleteCalendarAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-calendar-assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-calendar-assignments"] }),
  });
}

export function useLeaveWorkflows() {
  return useQuery<LeaveWorkflowTemplate[]>({
    queryKey: ["leave-workflows"],
    queryFn: async () => {
      const data = await apiGet<
        LeaveWorkflowTemplate[] | PaginatedResponse<LeaveWorkflowTemplate>
      >("leave-workflows");
      return asList(data);
    },
  });
}

export function useCreateLeaveWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveWorkflowTemplate> & { reason?: string }) =>
      apiPost<LeaveWorkflowTemplate>("leave-workflows", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-workflows"] }),
  });
}

export function useUpdateLeaveWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LeaveWorkflowTemplate> & { reason?: string };
    }) => apiPatch<LeaveWorkflowTemplate>(`leave-workflows/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-workflows"] }),
  });
}

export function useDeleteLeaveWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-workflows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-workflows"] }),
  });
}

export function useSimulateWorkflow() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { employee: string; leave_type?: string; total_working_days?: number };
    }) => apiPost<WorkflowSimulateResponse>(`leave-workflows/${id}/simulate/`, payload),
  });
}

export function useApproverDelegates() {
  return useQuery<ApproverDelegate[]>({
    queryKey: ["leave-approver-delegates"],
    queryFn: async () => {
      const data = await apiGet<ApproverDelegate[] | PaginatedResponse<ApproverDelegate>>(
        "leave-approver-delegates"
      );
      return asList(data);
    },
  });
}

export function useCreateApproverDelegate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ApproverDelegate>) =>
      apiPost<ApproverDelegate>("leave-approver-delegates", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-approver-delegates"] }),
  });
}

export function useUpdateApproverDelegate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ApproverDelegate> }) =>
      apiPatch<ApproverDelegate>(`leave-approver-delegates/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-approver-delegates"] }),
  });
}

export function useDeleteApproverDelegate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-approver-delegates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-approver-delegates"] }),
  });
}

export function useBlackoutPeriods() {
  return useQuery<LeaveBlackoutPeriod[]>({
    queryKey: ["leave-blackout-periods"],
    queryFn: async () => {
      const data = await apiGet<
        LeaveBlackoutPeriod[] | PaginatedResponse<LeaveBlackoutPeriod>
      >("leave-blackout-periods");
      return asList(data);
    },
  });
}

export function useCreateBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeaveBlackoutPeriod> & { reason?: string }) =>
      apiPost<LeaveBlackoutPeriod>("leave-blackout-periods", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-blackout-periods"] }),
  });
}

export function useUpdateBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LeaveBlackoutPeriod> & { reason?: string };
    }) => apiPatch<LeaveBlackoutPeriod>(`leave-blackout-periods/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-blackout-periods"] }),
  });
}

export function useDeleteBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-blackout-periods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-blackout-periods"] }),
  });
}
