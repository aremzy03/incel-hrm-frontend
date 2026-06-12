import { AlertTriangle } from "lucide-react";

interface PolicyNoticeProps {
  message: string;
}

export function PolicyNotice({ message }: PolicyNoticeProps) {
  return (
    <div className="flex gap-4 rounded-xl bg-tertiary-fixed p-6 text-on-tertiary-fixed-variant">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p className="text-body-md leading-relaxed font-medium">{message}</p>
    </div>
  );
}
