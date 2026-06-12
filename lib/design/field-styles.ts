import { cn } from "@/lib/utils";

export const stitchFieldClass = cn(
  "w-full rounded-xl border-none bg-surface-container-low px-4 py-3",
  "text-body-md text-on-surface placeholder:text-on-surface-variant",
  "focus:outline-none focus:ring-2 focus:ring-primary-container transition"
);

export const stitchSelectClass = cn(stitchFieldClass, "cursor-pointer");

export const stitchTextareaClass = cn(stitchFieldClass, "resize-y min-h-[80px]");

export const stitchCardClass = cn(
  "rounded-xl border border-outline-variant bg-surface-container-lowest custom-shadow"
);

export const stitchPageClass = "px-gutter py-8";
