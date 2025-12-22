// ui/src/api.ts
import type { DevStep, Project, DevType, ProjectContact } from "./types";
import type {
  ProjectEconomics,
  ProjectFinanceRun,
  ProjectFinanceRunInputs,
  ProjectIncentives,
  PermitRequirement,
} from "./types";

const API = (() => {
  const fromEnv = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (fromEnv) return fromEnv;

  const fallback = "http://127.0.0.1:8010/api";
  console.warn(
    `VITE_API_URL (preferred) or VITE_API_BASE is not set; falling back to ${fallback}. ` +
      `Set VITE_API_URL in your env for deployments.`,
  );
  return fallback;
})();

/* ---------- auth / token helpers ---------- */

type Tokens = {
  access: string;
  refresh: string;
};

const ACCESS_KEY = "dt_access_token";
const REFRESH_KEY = "dt_refresh_token";

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function saveTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

const originalFetch: typeof window.fetch = window.fetch.bind(window);

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const r = await originalFetch(`${API}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!r.ok) return false;
    const data = await r.json();
    if (data?.access && data?.refresh) {
      saveTokens({ access: data.access, refresh: data.refresh });
      return true;
    }
    return false;
  } catch (e) {
    console.warn("refresh failed", e);
    return false;
  }
}

async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
  attemptRefresh = true,
): Promise<Response> {
  const url = typeof input === "string" ? input : (input as any)?.url || "";
  const isApiRequest = typeof url === "string" && url.startsWith(API);

  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (isApiRequest && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await originalFetch(input as any, {
    ...init,
    headers,
  });

  const hasRefresh = !!getRefreshToken();
  const hasAccess = !!getAccessToken();

  if (response.status === 401 && isApiRequest && (hasRefresh || hasAccess)) {
    console.warn(
      `[auth] 401 for ${url || input}. attemptRefresh=${attemptRefresh} refreshPresent=${hasRefresh}`,
    );
  }

  if (response.status !== 401 || !attemptRefresh || !isApiRequest || !hasRefresh) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    console.warn("[auth] refresh token failed or expired; keeping 401 response.");
    clearTokens();
    try {
      window.dispatchEvent(new CustomEvent("dt_session_expired"));
    } catch (e) {
      // ignore if not in browser
    }
    return response;
  }

  const retryHeaders = new Headers(init.headers || {});
  const newAccess = getAccessToken();
  if (isApiRequest && newAccess) {
    retryHeaders.set("Authorization", `Bearer ${newAccess}`);
  }

  return originalFetch(input as any, {
    ...init,
    headers: retryHeaders,
  });
}

(globalThis as any).fetch = fetchWithAuth;

/* ---------- helpers ---------- */

async function jsonOrThrow(r: Response, context: string) {
  if (r.ok) {
    try {
      return await r.json();
    } catch {
      // no JSON body
      return null as any;
    }
  }
  let detail = "";
  try {
    detail = await r.text();
  } catch {}
  const errorMsg = `${context}: ${r.status} ${detail}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

/* ---------- auth endpoints ---------- */

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: {
    id: number;
    name: string;
    contact_email?: string;
  } | null;
  membership?: {
    id: number;
    role: string;
    status: string;
    company: number;
  } | null;
};

export async function loginUser(payload: { username?: string; email?: string; password: string }) {
  const r = await fetchWithAuth(`${API}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, false);
  const data = await jsonOrThrow(r, "login failed");
  if (data?.access && data?.refresh) {
    saveTokens({ access: data.access, refresh: data.refresh });
  }
  return data;
}

export async function logoutUser(): Promise<void> {
  clearTokens();
  try {
    await fetchWithAuth(`${API}/auth/logout/`, { method: "POST" }, false);
  } catch {}
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const r = await fetchWithAuth(`${API}/me/`);
  if (r.status === 401) {
    console.warn(
      "Auth check failed with 401. Ensure you are logged in and that localStorage has fresh dt_access_token / dt_refresh_token values.",
    );
    return null;
  }
  return jsonOrThrow(r, "me fetch failed");
}

/**
 * Normalize unknown date-ish input into:
 * - string "YYYY-MM-DD"  (valid date)
 * - null                 (explicit clear: null or "")
 * - undefined            (invalid / unparseable -> omit field)
 */
function toISODateOrUndefinedOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;

  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  }

  const d = new Date(String(v));
  if (isNaN(+d)) return undefined;

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

/* ---------- shared helpers ---------- */

const HIDDEN_STEP_NAMES = ["pre dev"];

function isHeaderStep(step: Pick<DevStep, "name">): boolean {
  const name = (step?.name || "").trim().toLowerCase();
  return HIDDEN_STEP_NAMES.includes(name);
}

/* ---------- Development Steps ---------- */

/** GET all steps (global; probably only for testing now) */
export async function fetchAllSteps(): Promise<DevStep[]> {
  const r = await fetch(`${API}/development-steps/`);
  const data = await jsonOrThrow(r, "steps fetch failed");
  return normalizeResults<DevStep>(data).filter((s) => !isHeaderStep(s));
}

/** GET steps for a specific project */
export async function fetchStepsForProject(
  projectId: number,
): Promise<DevStep[]> {
  // adjust param name ("project" vs "project_id") to match your DRF view
  const r = await fetch(`${API}/development-steps/?project=${projectId}`);
  const data = await jsonOrThrow(r, "steps fetch failed");
  return normalizeResults<DevStep>(data).filter((s) => !isHeaderStep(s));
}

/** CREATE a development step */
export async function createDevelopmentStep(
  payload: Partial<DevStep>,
): Promise<DevStep> {
  const body: any = { ...payload };
  delete body.id;
  const r = await fetch(`${API}/development-steps/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "step create failed");
}

/** DELETE a development step */
export async function deleteDevelopmentStep(id: number): Promise<void> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "DELETE",
  });
  await jsonOrThrow(r, "step delete failed");
}

/** PATCH status only */
export async function updateStepStatus(
  id: number,
  status: "Not Started" | "In Progress" | "Completed" | "Not Applicable",
): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return jsonOrThrow(r, "patch failed");
}

/** PATCH development_type only */
export async function updateStepDevType(
  id: number,
  development_type: DevType | "",
): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ development_type: development_type || null }),
  });
  return jsonOrThrow(r, "patch failed");
}

/** PATCH planned_spend / actual_spend */
export async function updateStepSpend(
  id: number,
  payload: { planned_spend?: number | null; actual_spend?: number | null },
): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "patch failed");
}

/** PATCH start/end dates (never include duration_days) */
export async function updateStepDates(
  id: number,
  payload: { start_date?: string | null; end_date?: string | null },
): Promise<DevStep> {
  const body: Record<string, unknown> = {};
  const sd = toISODateOrUndefinedOrNull(payload.start_date);
  const ed = toISODateOrUndefinedOrNull(payload.end_date);
  if (sd !== undefined) body.start_date = sd;
  if (ed !== undefined) body.end_date = ed;

  // If nothing valid to patch, just refetch the row
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

/** PATCH arbitrary metadata fields on a development step */
export async function updateStepMeta(
  id: number,
  payload: Partial<DevStep> & Record<string, any>,
): Promise<DevStep> {
  const r = await fetch(`${API}/development-steps/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "patch failed");
}

/* ---------- Project Contacts ---------- */

export async function createProjectContact(
  payload: Partial<ProjectContact>,
): Promise<ProjectContact> {
  const body = { ...payload };
  const r = await fetch(`${API}/project-contacts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "contact create failed");
}

export async function fetchProjectContacts(projectId: number): Promise<ProjectContact[]> {
  const r = await fetch(`${API}/project-contacts/?project_id=${projectId}`);
  const data = await jsonOrThrow(r, "contacts fetch failed");
  return normalizeResults<ProjectContact>(data);
}

export async function updateProjectContact(
  id: number,
  payload: Partial<ProjectContact>,
): Promise<ProjectContact> {
  const r = await fetch(`${API}/project-contacts/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "contact update failed");
}

/* ---------- Projects ---------- */

/** GET all projects */
export async function fetchProjects(): Promise<Project[]> {
  const r = await fetch(`${API}/projects/`);
  const data = await jsonOrThrow(r, "projects fetch failed");
  return normalizeResults<Project>(data);
}

/** GET one project by id */
export async function fetchProject(id: number): Promise<Project> {
  const r = await fetch(`${API}/projects/${id}/`);
  return jsonOrThrow(r, "project fetch failed");
}

/** CREATE a project */
export async function createProject(
  payload: Partial<Project>,
): Promise<Project> {
  const cleaned: any = { ...payload };
  delete cleaned.id;

  // Get all projects to determine the next sequential number
  if (!cleaned.project_name || cleaned.project_name === null) {
    try {
      const allProjects = await fetchProjects();
      const nextNum = allProjects.length + 1;
      cleaned.project_name = `New Project ${nextNum}`;
      cleaned.legal_name = `New Legal Entity ${nextNum}`;
    } catch {
      // Fallback if fetch fails
      cleaned.project_name = `New Project ${Date.now()}`;
      cleaned.legal_name = `New Legal Entity ${Date.now()}`;
    }
  }

  const r = await fetch(`${API}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });

  return jsonOrThrow(r, "project create failed");
}

/** PATCH a project */
export async function updateProject(
  id: number,
  payload: Partial<Project>,
): Promise<Project> {
  const r = await fetch(`${API}/projects/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "project update failed");
}

/** DELETE a project */
export async function deleteProject(id: number): Promise<void> {
  const r = await fetch(`${API}/projects/${id}/`, { method: "DELETE" });
  await jsonOrThrow(r, "project delete failed");
}

/* ---------- Economics / Incentives ---------- */

export async function fetchProjectEconomics(projectId: number): Promise<ProjectEconomics> {
  const r = await fetch(`${API}/projects/${projectId}/economics/`);
  return jsonOrThrow(r, "economics fetch failed");
}

export async function updateProjectEconomics(
  projectId: number,
  payload: Partial<ProjectEconomics>,
): Promise<ProjectEconomics> {
  const r = await fetch(`${API}/projects/${projectId}/economics/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "economics update failed");
}

export async function fetchProjectIncentives(projectId: number): Promise<ProjectIncentives> {
  const r = await fetch(`${API}/projects/${projectId}/incentives/`);
  return jsonOrThrow(r, "incentives fetch failed");
}

export async function updateProjectIncentives(
  projectId: number,
  payload: Partial<ProjectIncentives>,
): Promise<ProjectIncentives> {
  const r = await fetch(`${API}/projects/${projectId}/incentives/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "incentives update failed");
}

export async function reorderSteps(projectId: number, order: number[]): Promise<void> {
  const r = await fetch(`${API}/development-steps/reorder/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectId, order }),
  });
  await jsonOrThrow(r, "reorder failed");
}

export async function bootstrapProjectSteps(projectId: number): Promise<void> {
  const r = await fetch(`${API}/projects/${projectId}/bootstrap_steps/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok && r.status !== 404) {
    await jsonOrThrow(r, "bootstrap steps failed");
  }
}

/* ---------- Finance Runs ---------- */

export async function runProjectFinanceModel(
  projectId: number,
  payload: Partial<ProjectFinanceRunInputs>,
): Promise<ProjectFinanceRun> {
  const r = await fetch(`${API}/projects/${projectId}/finance/run/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "finance run failed");
}

/* ---------- Permit Requirements ---------- */

export async function fetchPermitRequirements(
  projectId: number,
  level?: string,
  search?: string,
): Promise<PermitRequirement[]> {
  const params = new URLSearchParams();
  params.append("project", String(projectId));
  if (level) params.append("level", level);
  if (search) params.append("search", search);
  const r = await fetch(`${API}/permit-requirements/?${params.toString()}`);
  const data = await jsonOrThrow(r, "permits fetch failed");
  return normalizeResults<PermitRequirement>(data);
}

export async function createPermitRequirement(
  payload: Partial<PermitRequirement>,
): Promise<PermitRequirement> {
  const body: any = { ...payload };
  delete body.id;
  const r = await fetch(`${API}/permit-requirements/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(r, "permit create failed");
}

export async function updatePermitRequirement(
  id: number,
  payload: Partial<PermitRequirement>,
): Promise<PermitRequirement> {
  const r = await fetch(`${API}/permit-requirements/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(r, "permit update failed");
}

export async function deletePermitRequirement(id: number): Promise<void> {
  const r = await fetch(`${API}/permit-requirements/${id}/`, { method: "DELETE" });
  await jsonOrThrow(r, "permit delete failed");
}

export async function bootstrapPermitRequirements(projectId: number): Promise<PermitRequirement[]> {
  const r = await fetch(`${API}/projects/${projectId}/bootstrap_permits/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (r.status === 404) {
    // Fallback for servers that don't yet expose bootstrap_permits: use existing seed endpoint then refetch.
    await seedPermitRequirements(projectId, false).catch(() => null);
    return fetchPermitRequirements(projectId);
  }
  const data = await jsonOrThrow(r, "permit bootstrap failed");
  return normalizeResults<PermitRequirement>(data);
}

export async function seedPermitRequirements(
  projectId: number,
  force = false,
): Promise<{ detail: string }> {
  const r = await fetch(`${API}/permit-requirements/seed/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectId, force }),
  });
  return jsonOrThrow(r, "permit seed failed");
}
