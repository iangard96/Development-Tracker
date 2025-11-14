/// ui/src/api.ts
import type { DevStep } from "./types";

const API = "http://127.0.0.1:8010/api";

export async function fetchAllSteps(): Promise<DevStep[]> {
  const r = await fetch(`${API}/development-steps/`);
  if (!r.ok) throw new Error(`steps fetch failed: ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function updateStepStatus(id: number, status: string): Promise<DevStep> {
  return patchStep(id, { status });
}

export async function updateStepDates(
  id: number,
  payload: { start_date?: string | null; end_date?: string | null }
): Promise<DevStep> {
  const body = { ...payload };
  if (body.start_date === "") body.start_date = null;
  if (body.end_date === "") body.end_date = null;
  return patchStep(id, body);
}

async function patchStep(id: number, body: unknown): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), // do NOT include duration_days here
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`patch failed: ${r.status} ${text}`);
  }
  return r.json();
}
