// ui/src/api.ts
import type { DevStep, Project } from "./types";

const API = "http://127.0.0.1:8010/api";

//const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8010/api";

/* ---------- helpers ---------- */

async function jsonOrThrow(r: Response, context: string) {
  if (r.ok) {
    // Try JSON, fall back to text
    try {
      return await r.json();
    } catch {
      return null as any;
    }
  }
  // Surface server error body to help debugging
  let detail = "";
  try {
    detail = await r.text();
  } catch {}
  throw new Error(`${context}: ${r.status} ${detail}`);
}

/**
 * Normalize unknown date-ish input into:
 * - string "YYYY-MM-DD"  (valid date)
 * - null                (explicit clear: null or "")
 * - undefined           (invalid / unparseable -> omit field)
 */
function toISODateOrUndefinedOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;

  if (typeof v === "string") {
    // If already "YYYY-MM-DD", keep it (avoid timezone shifts)
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  }

  const d = new Date(String(v));
  if (isNaN(+d)) return undefined; // <-- key change: omit invalid instead of null

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeResults<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

/* ---------- Development Steps ---------- */

/** GET all steps (handles DRF pagination or plain array) */
export async function fetchAllSteps(): Promise<DevStep[]> {
  const r = await fetch(`${API}/development-steps/`);
  const data = await jsonOrThrow(r, "steps fetch failed");
  return normalizeResults<DevStep>(data);
}

/** PATCH status only */
export async function updateStepStatus(
  id: number,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return jsonOrThrow(r, "patch failed");
}

/** PATCH start/end dates (never include duration_days) */
export async function updateStepDates(
  id: number,
  payload: { start_date?: string | null; end_date?: string | null }
): Promise<DevStep> {
  const body: Record<string, unknown> = {};
  const sd = toISODateOrUndefinedOrNull(payload.start_date);
  const ed = toISODateOrUndefinedOrNull(payload.end_date);
  if (sd !== undefined) body.start_date = sd;
  if (ed !== undefined) body.end_date = ed;

  // If nothing to update, avoid empty PATCH (can crash fragile backends)
  if (Object.keys(body).length === 0) {
    const r0 = await fetch(`${API}/development-steps/${id}/`);
    return jsonOrThrow(r0, "steps fetch failed");
  }

  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "patch failed");
}

/* ---------- Projects ---------- */

export async function fetchProjects(): Promise<Project[]> {
  const r = await fetch(`${API}/projects/`);
  const data = await jsonOrThrow(r, "projects fetch failed");
  return normalizeResults<Project>(data);
}

export async function createProject(payload: Partial<Project>): Promise<Project> {
  // clone + strip id no matter what
  const cleaned: any = { ...payload };
  delete cleaned.id;

  // force non-null required fields
  if (!cleaned.project_name || cleaned.project_name === null) {
    cleaned.project_name = `New Project ${Date.now()}`;
  }
  if (!cleaned.legal_name || cleaned.legal_name === null) {
    cleaned.legal_name = `New Legal Entity ${Date.now()}`;
  }

  const r = await fetch(`${API}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });

  return jsonOrThrow(r, "project create failed");
}

export async function updateProject(
  id: number,
  payload: Partial<Project>
): Promise<Project> {
  const r = await fetch(`${API}/projects/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "project update failed");
}

export async function deleteProject(id: number): Promise<void> {
  const r = await fetch(`${API}/projects/${id}/`, { method: "DELETE" });
  await jsonOrThrow(r, "project delete failed");
}
