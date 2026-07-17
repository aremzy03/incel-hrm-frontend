"use client";

import { Loader2 } from "lucide-react";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { stitchSelectClass } from "@/lib/design/field-styles";
import {
  formatRelieverName,
  getRelieverHelperText,
} from "@/lib/leave/reliever";
import type { EligibleRelieversResponse, EmployeeMinimal } from "@/lib/types/leave";

interface RelieverFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  relieverRequired: boolean;
  showField: boolean;
  relievers: EmployeeMinimal[];
  eligibleData?: EligibleRelieversResponse;
  isLoading?: boolean;
  error?: string | null;
  dataTour?: string;
  hrMode?: boolean;
}

export function RelieverField({
  id,
  value,
  onChange,
  relieverRequired,
  showField,
  relievers,
  eligibleData,
  isLoading = false,
  error,
  dataTour = "leave-cover-person",
  hrMode = false,
}: RelieverFieldProps) {
  if (!showField) return null;

  const helperText = hrMode
    ? "HR can assign any active employee as reliever."
    : getRelieverHelperText(eligibleData);
  const noOptions = relievers.length === 0;

  return (
    <div data-tour={dataTour}>
      <FieldLabel htmlFor={id} optional={!relieverRequired}>
        Reliever
      </FieldLabel>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading colleagues...
        </div>
      ) : (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={stitchSelectClass}
          disabled={noOptions}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        >
          <option value="">
            {noOptions ? "No relievers available" : "Select reliever"}
          </option>
          {relievers.map((person) => (
            <option key={person.id} value={person.id}>
              {formatRelieverName(person)}
            </option>
          ))}
        </select>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-label-md text-error" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-body-md text-on-surface-variant">
          {helperText}
        </p>
      )}
    </div>
  );
}
