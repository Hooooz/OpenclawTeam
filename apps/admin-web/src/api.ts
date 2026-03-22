import type { DashboardSnapshot } from "@openclaw/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3001";

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<DashboardSnapshot>;
}
