export interface PublicHoliday {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  is_recurring: boolean;
}

export type PublicHolidayUploadResponse = unknown;

