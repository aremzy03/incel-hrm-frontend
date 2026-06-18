import { LEAVE_TOURS } from "./leave";
import { LOANS_TOURS } from "./loans";
import type { TourDefinition, TourId, TourModule } from "../types";

export const ALL_TOURS: TourDefinition[] = [...LEAVE_TOURS, ...LOANS_TOURS];

export function getTourById(id: TourId): TourDefinition | undefined {
  return ALL_TOURS.find((t) => t.id === id);
}

export function getToursForModule(module: TourModule): TourDefinition[] {
  return ALL_TOURS.filter((t) => t.module === module);
}
