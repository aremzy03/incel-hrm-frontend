import type { TourId, TutorialProgressItem } from "./types";

interface TutorialProgressResponse {
  items: TutorialProgressItem[];
}

export async function fetchTutorialProgress(): Promise<TutorialProgressItem[]> {
  const res = await fetch("/api/auth/tutorial-progress", {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Failed to load tutorial progress.");
  }
  const data = (await res.json()) as TutorialProgressResponse;
  return data.items ?? [];
}

export async function updateTutorialProgress(
  tourId: TourId,
  action: "complete" | "dismiss"
): Promise<TutorialProgressItem> {
  const res = await fetch("/api/auth/tutorial-progress", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tour_id: tourId, action }),
  });
  if (!res.ok) {
    throw new Error("Failed to update tutorial progress.");
  }
  return res.json() as Promise<TutorialProgressItem>;
}
