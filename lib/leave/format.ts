export function formatLeaveDuration(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const monthYear = startDate.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  if (start === end) {
    return startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${startDate.getDate()}–${endDate.getDate()} ${monthYear}`;
  }

  const startLabel = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const endLabel = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}
