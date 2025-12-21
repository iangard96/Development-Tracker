// ui/src/DevActivities.tsx
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DevStep, DevType } from "./types";
import {
  findRequirementsForActivity,
  getRequirementTemplateLookup,
  normalizeActivityName,
  type RequirementLabel,
} from "./requirementTemplates";
import {
  fetchStepsForProject,
  updateStepDates,
  updateStepStatus,
  updateStepDevType,
  updateStepSpend,
  updateStepMeta,
  createProjectContact,
  fetchProjectContacts,
  createDevelopmentStep,
  deleteDevelopmentStep,
  reorderSteps,
} from "./api";
import { useProject } from "./ProjectContext";
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";

const th: React.CSSProperties = {
  textAlign: "left",
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 12,
  paddingRight: 12,
  fontWeight: 600,
  fontSize: 12,
  color: "var(--muted)",
  position: "sticky",
  top: 0,
  background: "var(--table-header)",
  zIndex: 3,
};
const td: React.CSSProperties = {
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 12,
  paddingRight: 12,
  verticalAlign: "middle",
  fontSize: 13,
};
const stickyActivity: React.CSSProperties = {
  position: "sticky",
  left: 0,
  top: 0,
  background: "var(--table-row)",
  zIndex: 4,
};
const requirementTh: React.CSSProperties = {
  ...th,
  width: 240,
  minWidth: 240,
};
const requirementTd: React.CSSProperties = {
  ...td,
  width: 240,
  minWidth: 240,
  verticalAlign: "top",
  background: "var(--table-row)",
};
const requirementList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
  justifyContent: "center",
  width: "100%",
};
const requirementLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  lineHeight: 1.2,
};
const requirementCheckbox: React.CSSProperties = {
  margin: 0,
};
const REQUIREMENT_OPTIONS = [
  "Engineering",
  "Permitting/Compliance",
  "Financing",
  "Interconnection",
  "Site Control",
  "Construction/Execution",
] as const;
const REQUIREMENT_FLAG_KEYS: Record<RequirementLabel, keyof DevStep> = {
  Engineering: "engineering_flag",
  "Permitting/Compliance": "permitting_compliance_flag",
  Financing: "financing_flag",
  Interconnection: "interconnection_flag",
  "Site Control": "site_control_flag",
  "Construction/Execution": "construction_execution_flag",
};
const sortBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text)",
  cursor: "pointer",
};

const HEATMAP_OPTIONS = [
  { label: "Red", value: "Red", color: "#ef4444" },
  { label: "Yellow", value: "Yellow", color: "#f59e0b" },
  { label: "Green", value: "Green", color: "#10b981" },
] as const;

const OWNER_OPTIONS = ["Internal", "Consultant", "External", "EPC"] as const;
const PHASE_OPTION_MAP: Record<"" | "1" | "2" | "3", string> = {
  "": "--",
  "1": "Early",
  "2": "Mid",
  "3": "Late",
};

const customStorageKey = (projectId: string | number) =>
  `dev-activities-custom-${projectId}`;

/** Convert whatever we have to what <input type="date"> expects (YYYY-MM-DD). */
function normalizeForDateInput(value?: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; // already ISO
  const d = new Date(value);
  if (isNaN(+d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Keep the native title in sync so long text is visible on hover. */
function syncTitle(e: React.ChangeEvent<HTMLInputElement>) {
  e.currentTarget.title = e.currentTarget.value;
}

function isCheckedFlag(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const lower = String(value).trim().toLowerCase();
  return ["x", "yes", "y", "1", "true"].includes(lower);
}

/** Small reusable date cell that PATCHes one field and returns the fresh row. */
function DateCell({
  value,
  onBlurValue,
}: {
  value: string | null | undefined;
  onBlurValue: (iso: string | null) => void;
}) {
  return (
    <input
      type="date"
      defaultValue={normalizeForDateInput(value)}
      onBlur={(e) => onBlurValue(e.currentTarget.value || null)}
      style={{
        padding: "6px 10px",
        border: "1px solid var(--border)",
        borderRadius: 5,
        fontSize: 13,
        background: "var(--table-row)",
        color: "var(--text)",
      }}
    />
  );
}

/** Status dropdown cell */
const STATUS_OPTIONS = ["", "Not Started", "In Progress", "Completed", "Not Applicable"] as const;
type StepStatus = (typeof STATUS_OPTIONS)[number];

function StatusCell({
  step,
  onSaved,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
}) {
  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as StepStatus;
    try {
      const fresh = await updateStepStatus(step.id, next);
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status.\n${err?.message ?? ""}`);
    }
  }

  return (
    <select
      value={(step.status as StepStatus) ?? ""}
      onChange={onChange}
      style={{
        padding: "6px 10px",
        border: "1px solid var(--border)",
        borderRadius: 5,
        background:
          "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "var(--text)",
        cursor: "pointer",
        appearance: "none" as any,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt === "" ? "--" : opt}
        </option>
      ))}
    </select>
  );
}

/** Dev Type dropdown cell */
const DEFAULT_DEV_TYPE_OPTIONS: DevType[] = [
  "",
  "Interconnection",
  "Permitting",
  "Due Diligence",
];

function DevTypeCell({
  step,
  customDevTypes,
  onCustomDevTypesChange,
  onSaved,
  rows,
  applyFresh,
}: {
  step: DevStep;
  customDevTypes: string[] | undefined;
  onCustomDevTypesChange: (next: string[]) => void;
  onSaved: (fresh: DevStep) => void;
  rows: DevStep[];
  applyFresh: (fresh: DevStep) => void;
}) {
  const safeCustom = Array.isArray(customDevTypes) ? customDevTypes : [];
  const baseOptions = DEFAULT_DEV_TYPE_OPTIONS.filter((x) => x !== "");
  const options = [...baseOptions, ...safeCustom];

  async function applyValue(next: string) {
    const normalized = next.trim();
    try {
      const fresh = await updateStepDevType(step.id, normalized as DevType);
      onSaved(fresh);
      if (
        normalized &&
        !baseOptions.includes(normalized as DevType) &&
        !safeCustom.includes(normalized)
      ) {
        onCustomDevTypesChange([...safeCustom, normalized]);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update development type.\n${err?.message ?? ""}`);
    }
  }

  return (
    <div style={{ position: "relative", minWidth: 200 }}>
      <select
        value={step.development_type ?? ""}
        onChange={async (e) => {
          const val = e.target.value;
          if (val === "__CUSTOM__") {
            const name = window.prompt("Add custom Dev Type");
            if (!name || !name.trim()) {
              e.target.value = step.development_type ?? "";
              return;
            }
            await applyValue(name.trim());
            return;
          }
          await applyValue(val);
        }}
        onDoubleClick={async (e) => {
          const current = (step.development_type ?? "").trim();
          if (!current) return;
          if (!safeCustom.includes(current)) return; // only edit custom
          const renamed = window.prompt("Rename custom Dev Type", current);
          if (!renamed || renamed.trim() === "" || renamed.trim() === current) return;
          const newName = renamed.trim();
          onCustomDevTypesChange(
            safeCustom.map((c) => (c === current ? newName : c)),
          );
          rows
            .filter((r) => (r.development_type ?? "") === current)
            .forEach(async (r) => {
              try {
                const fresh = await updateStepDevType(r.id, newName as DevType);
                applyFresh(fresh);
              } catch (err) {
                console.warn("Rename dev type failed for row", r.id, err);
              }
            });
          await applyValue(newName);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const current = (step.development_type ?? "").trim();
          if (!current) return;
          if (!safeCustom.includes(current)) return;
          const ok = window.confirm(`Remove custom Dev Type "${current}" and clear it from rows?`);
          if (!ok) return;
          onCustomDevTypesChange(safeCustom.filter((c) => c !== current));
          rows
            .filter((r) => (r.development_type ?? "") === current)
            .forEach(async (r) => {
              try {
                const fresh = await updateStepDevType(r.id, "" as DevType);
                applyFresh(fresh);
              } catch (err) {
                console.warn("Clear dev type failed for row", r.id, err);
              }
            });
          applyValue("");
        }}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text)",
          background:
            "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 10px center",
          backgroundSize: "10px",
          paddingRight: 28,
          appearance: "none" as any,
          cursor: "pointer",
        }}
      >
        <option value="">Select Dev Type</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option disabled>------------</option>
        <option value="__CUSTOM__">+ Add custom...</option>
      </select>
    </div>
  );
}

/** Purpose / related activity: point to another task within same dev type */
function RelatedActivityCell({
  step,
  peers,
  onSaved,
  onJumpToId,
}: {
  step: DevStep;
  peers: DevStep[];
  onSaved: (fresh: DevStep) => void;
  onJumpToId: (id: number) => void;
}) {
  const options = useMemo(() => {
    const currentType = step.development_type ?? "";
    return peers
      .filter(
        (p) =>
          p.id !== step.id &&
          (p.development_type ?? "") === currentType,
      )
      .map((p, idx) => {
        const seq = (p as any).sequence ?? idx + 1;
        return { value: String(p.id), label: `#${seq} - ${p.name}` };
      });
  }, [peers, step]);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    const nextId = raw === "" ? null : Number(raw);
    if (nextId) {
      onJumpToId(nextId);
    }
    // reset to placeholder so selection doesn't persist
    e.currentTarget.value = "";
    try {
      // do not persist selection; clear any stored value
      await updateStepMeta(step.id, { purpose_related_activity: null });
      onSaved({ ...step, purpose_related_activity: null });
    } catch (err) {
      console.warn("Failed to clear related activity", err);
    }
  }

  const typeLabel = step.development_type
    ? `${step.development_type} Related Activities`
    : "Related Activities";

  return (
    <select
      value=""
      onChange={onChange}
      style={{
        padding: "6px 10px",
        border: "1px solid var(--border)",
        borderRadius: 5,
        background:
          "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "var(--text)",
        cursor: "pointer",
        appearance: "none" as any,
        minWidth: 220,
      }}
    >
      <option value="">{typeLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ResponsiblePartyCell({
  step,
  onSaved,
  onContactSync,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
  onContactSync?: (org: string | null) => Promise<void> | void;
}) {
  const current = (step as any).responsible_party ?? "";

  async function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.currentTarget.value.trim();
    const next = val || null;
    if (next === (current || null)) return;

    try {
      const fresh = await updateStepMeta(step.id, { responsible_party: next });
      onSaved(fresh);
      if (next) {
        await onContactSync?.(next);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update responsible party.\n${err?.message ?? ""}`);
      e.currentTarget.value = current;
    }
  }

  return (
    <input
      type="text"
      defaultValue={current}
      placeholder="Responsible Party"
      title={current}
      onChange={syncTitle}
      onBlur={handleBlur}
      list="contact-orgs"
      style={{
        width: "100%",
        minWidth: 160,
        padding: "6px 10px",
        border: "1px solid var(--border)",
        borderRadius: 5,
        fontSize: 13,
        boxSizing: "border-box",
      }}
    />
  );
}

function OwnerCell({
  step,
  onSaved,
  onContactSync,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
  onContactSync?: (org: string | null) => Promise<void> | void;
}) {
  const current = (step as any).owner ?? "";
  const displayOptions = [...OWNER_OPTIONS];
  if (current && !displayOptions.includes(current as any)) {
    displayOptions.push(current as any);
  }

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const next = val || null;
    const prev = (step as any).owner ?? null;
    if ((prev || null) === next) return;

    // Keep UI responsive
    onSaved({ ...(step as any), owner: next } as DevStep);

    try {
      const fresh = await updateStepMeta(step.id, { owner: next });
      onSaved(fresh);
      if (next) {
        await onContactSync?.(next);
      }
    } catch (err: any) {
      console.error(err);
      onSaved({ ...(step as any), owner: prev } as DevStep);
      alert(`Failed to update owner.\n${err?.message ?? ""}`);
    }
  }

  return (
    <select
      value={current ?? ""}
      onChange={onChange}
      style={{
        padding: "6px 10px",
        border: "1px solid var(--border)",
        borderRadius: 5,
        background:
            "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "var(--text)",
        cursor: "pointer",
        appearance: "none" as any,
        minWidth: 160,
      }}
    >
      <option value="">Select</option>
      {displayOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function HeatmapCell({
  step,
  onSaved,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
}) {
  const current = ((step as any).risk_heatmap ?? "") as string;
  const [open, setOpen] = useState(false);

  async function handleSelect(value: string | null) {
    const next = value || null;
    const prev = (step as any).risk_heatmap ?? null;
    if ((prev || null) === next) return;

    // keep UI responsive
    onSaved({ ...(step as any), risk_heatmap: next } as DevStep);

    try {
      const fresh = await updateStepMeta(step.id, { risk_heatmap: next });
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      onSaved({ ...(step as any), risk_heatmap: prev } as DevStep);
      alert(`Failed to update risk heatmap.\n${err?.message ?? ""}`);
    }
    setOpen(false);
  }

  const currentOpt = HEATMAP_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === current.toLowerCase(),
  );
  const currentLabel = currentOpt ? currentOpt.label : "Select";
  const swatchColor = currentOpt ? currentOpt.color : "var(--border)";

  return (
    <div style={{ position: "relative", minWidth: 160 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "8px 10px",
          borderRadius: 6,
          border: currentOpt ? "1px solid var(--border)" : "1px solid var(--border)",
          background: currentOpt ? swatchColor : "var(--card)",
          cursor: "pointer",
          fontSize: 13,
          color: currentOpt ? "var(--card)" : "var(--text)",
          boxShadow: currentOpt ? "0 1px 2px rgba(0,0,0,0.08) inset" : undefined,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={currentOpt ? `${currentOpt.label} risk` : "Select risk heatmap"}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: 6,
              background: swatchColor,
              border: "1px solid var(--border)",
              boxShadow: currentOpt ? "0 0 0 1px var(--border) inset" : undefined,
            }}
          />
          <span style={{ fontSize: 0 }}>{currentLabel}</span>
        </span>
        <span aria-hidden="true" style={{ color: "var(--muted)" }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 10,
            marginTop: 6,
            minWidth: "100%",
            background: "var(--table-row)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {HEATMAP_OPTIONS.map((opt) => {
            const isActive =
              current.toLowerCase() === opt.value.toLowerCase();
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isActive}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: isActive ? "2px solid var(--text)" : "1px solid var(--border)",
                  background: "var(--table-row)",
                  cursor: "pointer",
                  color: "var(--text)",
                  boxShadow: isActive ? "0 0 0 2px var(--border)" : undefined,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: opt.color,
                    border: "1px solid var(--border)",
                  }}
                />
                <span style={{ fontSize: 0 }}>{opt.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--table-row)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--muted)",
              textAlign: "left",
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

/** Spend cell with deferred save (type freely, save on blur) */
function SpendCell({
  id,
  field,
  value,
  spendEdits,
  onEdit,
  onSaved,
}: {
  id: number;
  field: "planned_spend" | "actual_spend";
  value: number | null | undefined;
  spendEdits: Record<number, { planned: string; actual: string }>;
  onEdit: (id: number, field: "planned" | "actual", val: string) => void;
  onSaved: (fresh: DevStep) => void;
}) {
  const key = field === "planned_spend" ? "planned" : "actual";
  // Show locally edited value if present, otherwise show the prop value
  const displayValue =
    spendEdits[id]?.[key] !== undefined && spendEdits[id][key] !== ""
      ? spendEdits[id][key]
      : value !== null && value !== undefined
        ? String(value)
        : "";

  async function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = e.currentTarget.value;

    try {
      const num = raw === "" ? null : Number(raw);
      const v = num !== null ? Math.round(num * 100) / 100 : null;

      const fresh = await updateStepSpend(id, {
        [field]: v,
      });
      // Update parent state first with fresh data
      onSaved(fresh);
      // Clear local edit state - component will now show fresh prop value
      onEdit(id, key, "");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update ${key} spend.\n${err?.message ?? ""}`);
    }
  }

  return (
    <input
      type="number"
      min={0}
      step="any"
      value={displayValue}
      onChange={(e) => onEdit(id, key, e.target.value)}
      onBlur={handleBlur}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 5,
        border: "1px solid var(--border)",
        fontSize: 14,
        fontWeight: 500,
        background: "var(--table-row)",
        color: "var(--text)",
        boxSizing: "border-box",
        textAlign: "right",
      }}
    />
  );
}

export default function DevActivities() {
  const { projectId, project } = useProject();
  const noProjectSelected = !projectId;
  const [rows, setRows] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devTypeFilter, setDevTypeFilter] = useState<DevType | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<1 | 2 | 3 | "ALL">("ALL");
  const [customIds, setCustomIds] = useState<Set<number>>(new Set());
  const [customDevTypes, setCustomDevTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    | "status"
    | "phase"
    | "name"
    | "planned_spend"
    | "actual_spend"
    | "start_date"
    | "end_date"
    | "duration_days"
    | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const safeCustomDevTypes = Array.isArray(customDevTypes) ? customDevTypes : [];
  // Local state for spend inputs so we can type freely
  const [spendEdits, setSpendEdits] = useState<
    Record<number, { planned: string; actual: string }>
  >({});
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const seededRequirementDefaults = useRef<Set<number>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [contactsMeta, setContactsMeta] = useState<
    { id: number; organization: string; name: string }
  >([]);
  const [contactOrgs, setContactOrgs] = useState<string[]>([]);
  const [reorderPending, setReorderPending] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityPhase, setNewActivityPhase] = useState<"" | 1 | 2 | 3>("");
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 200);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    seededRequirementDefaults.current = new Set();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setCustomIds(new Set());
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(customStorageKey(projectId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((id) => typeof id === "number");
        setCustomIds(new Set(cleaned as number[]));
      }
    } catch (err) {
      console.warn("Failed to restore custom activities", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        customStorageKey(projectId),
        JSON.stringify(Array.from(customIds)),
      );
    } catch (err) {
      console.warn("Failed to persist custom activities", err);
    }
  }, [customIds, projectId]);

  useEffect(() => {
    if (!rows) return;
    setCustomIds((prev) => {
      const idsInRows = new Set(rows.map((r) => r.id));
      const filtered = new Set(
        Array.from(prev).filter((id) => idsInRows.has(id)),
      );
      if (filtered.size === prev.size) return prev;
      return filtered;
    });
  }, [rows]);

  const applyFresh = useCallback(
    (fresh: DevStep) =>
      setRows((cur) =>
        cur
          ? cur.map((x) => (x.id === fresh.id ? { ...x, ...fresh } : x))
          : cur,
      ),
    [],
  );

  // Defer heavy filtering/sorting work so header indicators feel snappier
  const deferredRows = useDeferredValue(rows);
  const deferredSearch = useDeferredValue(searchTerm);
  const deferredDevTypeFilter = useDeferredValue(devTypeFilter);
  const deferredPhaseFilter = useDeferredValue(phaseFilter);

  async function maybeCreateContact(opts: {
    organization: string | null | undefined;
    name?: string | null;
    responsibility?: string | null;
  }) {
    if (!projectId) return;
    const orgRaw = (opts.organization || "").trim();
    const nameRaw = (opts.name || "").trim();
    const orgNorm = orgRaw.toLowerCase();
    const nameNorm = nameRaw.toLowerCase();
    const responsibility = opts.responsibility ?? "Unspecified";
    if (!orgNorm) return;

    const existing = contactsMeta.find((c) => {
      const cOrg = c.organization.trim().toLowerCase();
      const cName = c.name.trim().toLowerCase();
      if (nameNorm) {
        return cOrg === orgNorm && cName === nameNorm;
      }
      return cOrg === orgNorm && cName === "";
    });
    if (existing) return;

    try {
      const created = await createProjectContact({
        project: Number(projectId),
        organization: orgRaw || null,
        name: nameRaw || "",
        responsibility,
      });
      setContactsMeta((prev) => [
        ...prev,
        { id: created.id, organization: orgRaw || "", name: nameRaw },
      ]);
      setContactOrgs((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...(orgRaw ? [orgRaw] : []),
          ]),
        ),
      );
    } catch (err) {
      console.warn("Contact create failed", err);
    }
  }

  useEffect(() => {
    if (!projectId) {
      setRows(null);
      setErr(null);
      return;
    }

    setRows(null);
    setErr(null);
    fetchStepsForProject(projectId)
      .then((data) => {
        setRows(data);
        // derive custom dev types from data
        const extras = Array.from(
          new Set(
            data
              .map((d) => d.development_type || "")
              .filter(
                (dt) =>
                  dt &&
                  !DEFAULT_DEV_TYPE_OPTIONS.includes(dt as DevType),
              ),
          ),
        );
        setCustomDevTypes(extras);
      })
      .catch((e) => setErr(String(e)));

    fetchProjectContacts(projectId)
      .then((data) => {
        const mapped = data.map((c) => ({
          id: c.id,
          organization: (c.organization ?? "").trim(),
          name: (c.name ?? "").trim(),
        }));
        setContactsMeta(mapped);
        setContactOrgs(
          Array.from(
            new Set(
              mapped
                .map((c) => c.organization)
                .filter((n) => n.length > 0),
            ),
          ),
        );
      })
      .catch((e) => console.warn("Failed to load contacts", e));
  }, [projectId]);

  const filtered = useMemo(() => {
    if (!deferredRows) return [];
    const base = [...deferredRows].sort(
      (a: any, b: any) =>
        (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id,
    );
    const byType =
      deferredDevTypeFilter === "ALL"
        ? base
        : base.filter((r) => (r.development_type ?? "") === deferredDevTypeFilter);

    const byPhase =
      deferredPhaseFilter === "ALL"
        ? byType
        : byType.filter((r) => {
            const ph = (r as any).phase ?? null;
            return ph === deferredPhaseFilter;
          });

    if (!deferredSearch.trim()) return byPhase;
    const q = deferredSearch.toLowerCase();
    return byPhase.filter((r) => r.name.toLowerCase().includes(q));
  }, [deferredRows, deferredDevTypeFilter, deferredPhaseFilter, deferredSearch]);

  const deferredFiltered = useDeferredValue(filtered);

  const requirementSets = useMemo(() => {
    const map = new Map<number, Set<string>>();
    (rows ?? []).forEach((r) => {
      const raw = ((r as any).requirement ?? "") as string;
      const set = new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      if (set.size === 0) {
        const flagMap: Array<[keyof DevStep, string]> = [
          ["site_control_flag", "Site Control"],
          ["engineering_flag", "Engineering"],
          ["interconnection_flag", "Interconnection"],
          ["permitting_compliance_flag", "Permitting/Compliance"],
          ["financing_flag", "Financing"],
          ["construction_execution_flag", "Construction/Execution"],
        ];
        flagMap.forEach(([key, label]) => {
          const val = (r as any)[key];
          if (isCheckedFlag(val)) {
            set.add(label);
          }
        });
      }
      map.set(r.id, set);
    });
    return map;
  }, [rows]);

  useEffect(() => {
    if (!rows || !project?.project_type) return;
    const templateLookup = getRequirementTemplateLookup(project.project_type);
    if (!templateLookup) return;

    const setsEqual = (a: Set<string>, b: Set<string>) => {
      if (a.size !== b.size) return false;
      for (const val of a) {
        if (!b.has(val)) return false;
      }
      return true;
    };

    const pendingSeeds = rows
      .map((row) => {
        if (seededRequirementDefaults.current.has(row.id)) return null;
        const templateReqs = findRequirementsForActivity(templateLookup, row.name ?? "");
        if (!templateReqs) return null; // no template entry
        const currentReqs = new Set(requirementSets.get(row.id) ?? []);
        const templateReqStrings = new Set(Array.from(templateReqs).map((r) => r));
        if (setsEqual(templateReqStrings, currentReqs)) return null; // already in sync
        return { row, templateReqs: templateReqStrings };
      })
      .filter(Boolean) as { row: DevStep; templateReqs: Set<RequirementLabel> }[];

    if (pendingSeeds.length === 0) return;

    (async () => {
      for (const { row, templateReqs } of pendingSeeds) {
        const requirementValue = Array.from(templateReqs).join(", ");
        const payload: Partial<DevStep> = { requirement: requirementValue || null };
        Object.entries(REQUIREMENT_FLAG_KEYS).forEach(([label, key]) => {
          payload[key] = templateReqs.has(label as RequirementLabel) ? "X" : null;
        });
        try {
          const fresh = await updateStepMeta(row.id, payload);
          applyFresh(fresh);
          seededRequirementDefaults.current.add(row.id);
        } catch (err) {
          console.warn("Failed to seed requirements from template", row.id, err);
        }
      }
    })();
  }, [applyFresh, project?.project_type, requirementSets, rows]);

  const sorted = useMemo(() => {
    const list = [...deferredFiltered];
    if (!sortBy) return list;

    const cmp = (aVal: any, bVal: any) => {
      const aMissing = aVal === null || aVal === undefined || aVal === "";
      const bMissing = bVal === null || bVal === undefined || bVal === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (aVal === bVal) return 0;
      return aVal < bVal ? -1 : 1;
    };

    list.sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;
      switch (sortBy) {
        case "status":
          aVal = (a.status ?? "").toString().toLowerCase();
          bVal = (b.status ?? "").toString().toLowerCase();
          break;
        case "phase":
          aVal = a.phase ?? 999;
          bVal = b.phase ?? 999;
          break;
        case "name":
          aVal = (a.name ?? "").toString().toLowerCase();
          bVal = (b.name ?? "").toString().toLowerCase();
          break;
        case "planned_spend":
          aVal = a.planned_spend ?? null;
          bVal = b.planned_spend ?? null;
          break;
        case "actual_spend":
          aVal = a.actual_spend ?? null;
          bVal = b.actual_spend ?? null;
          break;
        case "start_date":
          aVal = a.start_date ? new Date(a.start_date).getTime() : null;
          bVal = b.start_date ? new Date(b.start_date).getTime() : null;
          break;
        case "end_date":
          aVal = a.end_date ? new Date(a.end_date).getTime() : null;
          bVal = b.end_date ? new Date(b.end_date).getTime() : null;
          break;
        case "duration_days":
          aVal = a.duration_days ?? null;
          bVal = b.duration_days ?? null;
          break;
        default:
          aVal = null;
          bVal = null;
      }
      const res = cmp(aVal, bVal);
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = useCallback((key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }, [sortBy]);

  const resetSort = () => {
    setSortBy(null);
    setSortDir("asc");
    setDevTypeFilter("ALL");
    setPhaseFilter("ALL");
    setSearchInput("");
    setSearchTerm("");
    if (!projectId) return;
    const ordered = [...(rows ?? [])].sort((a, b) => a.id - b.id);
    setRows(ordered.map((r, idx) => ({ ...r, sequence: idx + 1 })));
    setReorderPending(true);
    (async () => {
      try {
        const orderedIds = ordered.map((r) => r.id);
        if (orderedIds.length > 0) {
          await reorderSteps(projectId, orderedIds);
        }
        const fresh = await fetchStepsForProject(projectId);
        setRows(fresh);
      } catch (e: any) {
        setErr(String(e));
      } finally {
        setReorderPending(false);
      }
    })();
  };

  const orderedBySequence = useMemo(() => {
    return [...(rows ?? [])].sort((a: any, b: any) => {
      const aSeq = (a.sequence ?? Number.MAX_SAFE_INTEGER);
      const bSeq = (b.sequence ?? Number.MAX_SAFE_INTEGER);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return a.id - b.id;
    });
  }, [rows]);

  const hasCustomOrder = useMemo(() => {
    if (!rows || rows.length === 0) return false;
    const idsBySeq = orderedBySequence.map((r) => r.id);
    const idsById = [...rows].sort((a, b) => a.id - b.id).map((r) => r.id);
    if (idsBySeq.length !== idsById.length) return true;
    for (let i = 0; i < idsBySeq.length; i++) {
      if (idsBySeq[i] !== idsById[i]) return true;
    }
    return false;
  }, [orderedBySequence, rows]);

  const canReorder = useMemo(
    () =>
      !sortBy &&
      !searchTerm.trim() &&
      devTypeFilter === "ALL" &&
      phaseFilter === "ALL",
    [devTypeFilter, phaseFilter, searchTerm, sortBy],
  );

  const performReorder = useCallback(
    async (orderedIds: number[]) => {
      if (!projectId) return;
      const nextSeq = orderedIds.map((id, idx) => ({ id, sequence: idx + 1 }));
      setRows((cur) =>
        cur
          ? cur.map((r) => {
              const found = nextSeq.find((n) => n.id === r.id);
              return found ? { ...r, sequence: found.sequence } : r;
            })
          : cur,
      );
      setReorderPending(true);
      try {
        await reorderSteps(projectId, orderedIds);
      } catch (err) {
        console.warn("Reorder failed", err);
        alert("Reorder failed. Please try again.");
        fetchStepsForProject(projectId)
          .then((data) => setRows(data))
          .catch((e) => setErr(String(e)));
      } finally {
        setReorderPending(false);
      }
    },
    [projectId],
  );

  const handleDropReorder = useCallback(
    (dragId: number, targetId: number) => {
      if (!projectId) return;
      if (!canReorder) {
        alert("Reset filters and sorting before reordering.");
        return;
      }
      const current = [...orderedBySequence];
      const fromIdx = current.findIndex((r) => r.id === dragId);
      const toIdx = current.findIndex((r) => r.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;
      const updated = [...current];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      performReorder(updated.map((r) => r.id));
    },
    [canReorder, orderedBySequence, performReorder, projectId],
  );

  if (noProjectSelected) {
    return (
      <div style={{ padding: 16, color: "var(--muted)", fontSize: 14 }}>
        Select a project from the Project Summary to edit its development activities.
      </div>
    );
  }

  if (err)
    return <div style={{ color: "red", padding: 16 }}>Error: {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Loading...</div>;

  const toIso = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate(),
    ).padStart(2, "0")}`;

  const parseDateOnly = (value?: string | null): Date | null => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((p) => Number(p));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    return new Date(Date.UTC(y, m - 1, d));
  };

  const computeDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const s = parseDateOnly(start);
    const e = parseDateOnly(end);
    if (Number.isNaN(+s) || Number.isNaN(+e)) return null;
    const diffMs = e.getTime() - s.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return days > 0 ? days : null;
  };

  const handleDateUpdate = async (
    row: DevStep,
    field: "start_date" | "end_date",
    iso: string | null,
  ) => {
    const currentStart = (row as any).start_date || null;
    const currentEnd = (row as any).end_date || null;
    const duration = (row as any).duration_days;

    let start = field === "start_date" ? iso : currentStart;
    let end = field === "end_date" ? iso : currentEnd;

    const durationNum =
      duration === null || duration === undefined
        ? null
        : Number.isFinite(Number(duration))
        ? Math.ceil(Number(duration))
        : null;

    // Default payload just saves the edited field
    let payload: { start_date?: string | null; end_date?: string | null } = {
      [field]: iso,
    };

    // Compute missing date when we have start+duration or end+duration
    if (start && end) {
      payload = { start_date: start, end_date: end };
    } else if (start && !end && durationNum && durationNum > 0) {
      const base = parseDateOnly(start);
      if (!Number.isNaN(+base)) {
        base.setUTCDate(base.getUTCDate() + durationNum);
        const computed = toIso(base);
        const ok = window.confirm(
          `Compute end date as ${computed} from start + duration?`,
        );
        if (ok) {
          payload = { start_date: start, end_date: computed };
        } else {
          payload = { start_date: start };
        }
      }
    } else if (end && !start && durationNum && durationNum > 0) {
      const base = parseDateOnly(end);
      if (!Number.isNaN(+base)) {
        base.setUTCDate(base.getUTCDate() - durationNum);
        const computed = toIso(base);
        const ok = window.confirm(
          `Compute start date as ${computed} from end - duration?`,
        );
        if (ok) {
          payload = { start_date: computed, end_date: end };
        } else {
          payload = { end_date: end };
        }
      }
    }

    try {
      const fresh = await updateStepDates(row.id, payload);
      setRows((cur) =>
        cur
          ? cur.map((x) => {
              if (x.id !== row.id) return x;
              const computedDuration = computeDuration(
                (fresh as any).start_date ?? start,
                (fresh as any).end_date ?? end,
              );
              return { ...x, ...fresh, duration_days: computedDuration };
            })
          : cur,
      );
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update date.\n${err?.message ?? ""}`);
    }
  };

  const handleDurationUpdate = async (row: DevStep, durationInput: string) => {
    const parsed = Number(durationInput);
    const duration = Number.isFinite(parsed) ? Math.max(0, Math.ceil(parsed)) : null;
    if (!duration || duration <= 0) {
      alert("Enter a duration greater than zero to compute dates.");
      return;
    }

    const currentStart = (row as any).start_date || null;
    const currentEnd = (row as any).end_date || null;

    if (!currentStart && !currentEnd) {
      alert("Set a start or end date before updating duration.");
      return;
    }

    const offsetDays = duration - 1; // inclusive duration

    let payload: { start_date?: string | null; end_date?: string | null } = {};

    if (currentStart) {
      const base = parseDateOnly(currentStart);
      if (Number.isNaN(+base)) {
        alert("Start date is invalid; fix it before setting duration.");
        return;
      }
      base.setUTCDate(base.getUTCDate() + offsetDays);
      payload = { start_date: currentStart, end_date: toIso(base) };
    } else if (currentEnd) {
      const base = parseDateOnly(currentEnd);
      if (Number.isNaN(+base)) {
        alert("End date is invalid; fix it before setting duration.");
        return;
      }
      base.setUTCDate(base.getUTCDate() - offsetDays);
      payload = { start_date: toIso(base), end_date: currentEnd };
    }

    try {
      const fresh = await updateStepDates(row.id, payload);
      setRows((cur) =>
        cur
          ? cur.map((x) => {
              if (x.id !== row.id) return x;
              const computedDuration = computeDuration(
                (fresh as any).start_date ?? payload.start_date,
                (fresh as any).end_date ?? payload.end_date,
              );
              return {
                ...x,
                ...fresh,
                duration_days: computedDuration ?? duration,
              };
            })
          : cur,
      );
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update duration.\n${err?.message ?? ""}`);
    }
  };

  const resetAddForm = useCallback(() => {
    setNewActivityName("");
    setNewActivityPhase("");
    setShowAddForm(false);
    setAddSaving(false);
  }, []);

  const handleAddActivity = useCallback(async () => {
    if (!projectId) return;
    const trimmed = newActivityName.trim();
    if (!trimmed) {
      alert("Enter an activity name.");
      return;
    }
    const phaseVal = newActivityPhase === "" ? null : newActivityPhase;
    setAddSaving(true);
    try {
      const created = await createDevelopmentStep({
        project: Number(projectId),
        name: trimmed,
        phase: phaseVal,
      });
      setRows((cur) => (cur ? [...cur, created] : [created]));
      setCustomIds((prev) => {
        const next = new Set(prev);
        next.add(created.id);
        return next;
      });
      setNewActivityName("");
      setNewActivityPhase("");
      setShowAddForm(false);

      window.setTimeout(() => {
        const rowEl = rowRefs.current[created.id];
        const container = tableContainerRef.current;
        if (rowEl && container) {
          rowEl.scrollIntoView({ block: "center" });
        }
      }, 50);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to add activity.\n${err?.message ?? ""}`);
    } finally {
      setAddSaving(false);
    }
  }, [newActivityName, newActivityPhase, projectId]);

  const jumpToId = (id: number) => {
    const target = sorted.find((p) => p.id === id);
    if (target) {
      const el = rowRefs.current[target.id];
      const container = tableContainerRef.current;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const rowRect = el.getBoundingClientRect();
        const offset = rowRect.top - containerRect.top;
        // Center the row within the scrollable area
        const targetScroll =
          container.scrollTop +
          offset -
          (container.clientHeight / 2 - rowRect.height / 2);
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      }

      setHighlighted((prev) => {
        const next = new Set(prev);
        next.add(target.id);
        return next;
      });
      window.setTimeout(() => {
        setHighlighted((prev) => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
      }, 2200);
    }
  };

  return (
    <div className="page-root">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 12,
        }}
      >
        {project && (
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", margin: 0 }}>
            {project.project_name}
          </h1>
        )}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}
          className="print-hidden"
        >
          <SaveAsPdfButton style={{ marginRight: 4 }} />
          <img
            src={logo}
            alt="Land Charge"
            style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)", margin: 0 }}>
          Development Activities
        </h2>
        {project?.project_type && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Project type: {project.project_type}
          </div>
        )}
        <div className="print-hidden" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {sortBy && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Sorted by {sortBy.replace("_", " ")} ({sortDir})
            </div>
          )}
          {hasCustomOrder && (
            <div style={{ fontSize: 12, color: "var(--danger)" }} title="Order differs from default">
              Custom order
            </div>
          )}
          <button
            type="button"
            onClick={resetSort}
            style={{
              border: "1px solid var(--border)",
              background: "var(--table-row)",
              color: "var(--text)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
            disabled={reorderPending}
            title="Reset to original order"
          >
            Reset order
          </button>
        </div>
      </div>

      {/* Dev Type filter */}
      <div
        style={{
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ marginRight: 8 }}>Development Type</span>
          <select
            value={devTypeFilter}
            onChange={(e) =>
              setDevTypeFilter(e.target.value as DevType | "ALL")
            }
            style={{
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px solid var(--border)",
              fontSize: 13,
              background:
                "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
              backgroundSize: "10px",
              paddingRight: 24,
              color: "var(--text)",
              cursor: "pointer",
              appearance: "none" as any,
            }}
          >
            <option value="ALL">All</option>
            {DEFAULT_DEV_TYPE_OPTIONS.filter((x) => x !== "").map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {safeCustomDevTypes.map((opt) => (
              <option key={`custom-${opt}`} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Search Activity</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by activity name"
            style={{
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--text)",
              background: "var(--table-row)",
            }}
          />
        </label>
        <label style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Phase</span>
          <select
            value={phaseFilter}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "ALL") {
                setPhaseFilter("ALL");
              } else {
                const num = Number(val);
                if (num === 1 || num === 2 || num === 3) {
                  setPhaseFilter(num);
                } else {
                  setPhaseFilter("ALL");
                }
              }
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px solid var(--border)",
              fontSize: 13,
              background:
                "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
              backgroundSize: "10px",
              paddingRight: 24,
              color: "var(--text)",
              cursor: "pointer",
              appearance: "none" as any,
            }}
          >
            <option value="ALL">All</option>
            <option value={1}>Early</option>
            <option value={2}>Mid</option>
            <option value={3}>Late</option>
          </select>
        </label>
      </div>

      <div
        style={{
          overflow: "auto",
          maxHeight: "70vh",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "linear-gradient(var(--table-row) 0 52px, var(--card) 52px)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          position: "relative",
        }}
        ref={tableContainerRef}
      >
        <table
          style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}
        >
          <thead style={{ background: "var(--table-row)" }}>
            <tr>
              <th style={{ ...th, width: 70 }}>Order</th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("status")}>
                  Status {sortBy === "status" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("phase")}>
                  Phase {sortBy === "phase" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={{ ...th, ...stickyActivity }}>
                <button style={sortBtn} onClick={() => toggleSort("name")}>
                  Activity {sortBy === "name" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={{ ...th, minWidth: 140 }}>Risk Heatmap</th>
              <th style={{ ...th, minWidth: 200 }}>Dev Type</th>
              <th style={{ ...th, minWidth: "140px" }}>
                <button style={sortBtn} onClick={() => toggleSort("planned_spend")}>
                  Planned Spend ($) {sortBy === "planned_spend" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={{ ...th, minWidth: "140px" }}>
                <button style={sortBtn} onClick={() => toggleSort("actual_spend")}>
                  Actual Spend ($) {sortBy === "actual_spend" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("start_date")}>
                  Start Date {sortBy === "start_date" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("end_date")}>
                  End Date {sortBy === "end_date" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("duration_days")}>
                  Duration (Days) {sortBy === "duration_days" ? (sortDir === "asc" ? "Γû▓" : "Γû╝") : ""}
                </button>
              </th>
              <th style={th}>Purpose / Related Activity</th>
              <th style={{ ...th, minWidth: 160 }}>Owner</th>
              <th style={th}>Responsible Party</th>
              <th style={th}>Responsible Individual</th>
              <th style={th}>Process</th>
              <th style={th}>Link</th>
              <th style={{ ...th, ...requirementTh }}>Requirement</th>
              <th style={{ ...th, minWidth: 180 }}>Storage Hybrid Impact</th>
              <th style={{ ...th, minWidth: 140, textAlign: "center" }}>Milestones / NTP Gates</th>
              <th style={{ ...th, width: 100, minWidth: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.id}
                ref={(el) => {
                  rowRefs.current[r.id] = el;
                }}
                draggable={canReorder}
                onDragStart={() => setDraggingId(r.id)}
                onDragOver={(e) => {
                  if (canReorder) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId && draggingId !== r.id) {
                    handleDropReorder(draggingId, r.id);
                  }
                  setDraggingId(null);
                }}
                onDragEnd={() => setDraggingId(null)}
                style={{
                  borderTop: "1px solid var(--border)",
                  background: highlighted.has(r.id) ? "rgba(245, 182, 59, 0.16)" : undefined,
                  transition: "background 0.3s ease",
                }}
              >
                <td
                  style={{ ...td, width: 70, cursor: canReorder ? "grab" : "default", userSelect: "none" }}
                  title={canReorder ? "Drag to reorder" : "Reset filters/sorting to reorder"}
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                    style={{ display: "block", color: "var(--muted)" }}
                  >
                    <path
                      d="M3 4.5h10M3 8h10M3 11.5h10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </td>

                {/* Status */}
                <td style={td}>
                  <StatusCell
                    step={r}
                    customDevTypes={customDevTypes}
                    onCustomDevTypesChange={setCustomDevTypes}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur
                          ? cur.map((x) =>
                              x.id === r.id ? { ...x, ...fresh } : x,
                            )
                          : cur,
                      )
                    }
                    rows={sorted}
                    applyFresh={applyFresh}
                  />
                </td>

                {/* Phase */}
                <td style={td}>
                  {(() => {
                    const isCustom =
                      customIds.has(r.id) ||
                      (r.name || "").toLowerCase().includes("custom");

                    const phaseVal = (r as any).phase ?? null;
                    const phaseKey = (phaseVal === null ? "" : String(phaseVal)) as
                      | ""
                      | "1"
                      | "2"
                      | "3";
                    const phaseLabel = PHASE_OPTION_MAP[phaseKey] ?? "--";

                    if (!isCustom) {
                      return phaseLabel;
                    }

                    return (
                      <select
                        defaultValue={phaseVal ?? ""}
                        onChange={async (e) => {
                          const raw = e.target.value;
                          const next = raw === "" ? null : Number(raw);
                          const current = (r as any).phase ?? null;
                          if (next === current) return;
                          try {
                            const fresh = await updateStepMeta(r.id, { phase: next });
                            applyFresh(fresh);
                          } catch (err: any) {
                            console.error(err);
                            alert(`Failed to update phase.\n${err?.message ?? ""}`);
                            e.target.value = current ?? "";
                          }
                        }}
                        style={{
                          width: "100%",
                          minWidth: 120,
                          padding: "8px 10px",
                          borderRadius: 5,
                          border: "1px solid var(--border)",
                          fontSize: 13,
                          boxSizing: "border-box",
                          background:
                            "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
                          backgroundSize: "10px",
                          paddingRight: 24,
                        }}
                      >
                        <option value="">--</option>
                        <option value="1">Early</option>
                        <option value="2">Mid</option>
                        <option value="3">Late</option>
                      </select>
                    );
                  })()}
                </td>

                {/* Activity / Tasks */}
                <td style={{ ...td, ...stickyActivity }}>
                  {(() => {
                    const isCustom =
                      customIds.has(r.id) ||
                      (r.name || "").toLowerCase().includes("custom");
                    if (!isCustom) return r.name;
                    return (
                      <input
                        type="text"
                        defaultValue={r.name}
                        onBlur={async (e) => {
                          const val = e.currentTarget.value.trim();
                          if (!val) {
                            e.currentTarget.value = r.name;
                            return;
                          }
                          if (val === r.name) return;
                          try {
                            const fresh = await updateStepMeta(r.id, { name: val });
                            applyFresh(fresh);
                          } catch (err: any) {
                            console.error(err);
                            alert(`Failed to update activity name.\n${err?.message ?? ""}`);
                            e.currentTarget.value = r.name;
                          }
                        }}
                        style={{
                          width: "100%",
                          minWidth: 260,
                          padding: "8px 10px",
                          borderRadius: 5,
                          border: "1px solid var(--border)",
                          fontSize: 13,
                          boxSizing: "border-box",
                        }}
                      />
                    );
                  })()}
                </td>



                {/* Risk Heatmap */}
                <td
                  style={{
                    ...td,
                    minWidth: 160,
                    background: (() => {
                      const match = HEATMAP_OPTIONS.find(
                        (opt) =>
                          ((r as any).risk_heatmap ?? "")
                            .toLowerCase() === opt.value.toLowerCase(),
                      );
                      return match ? `${match.color}1a` : undefined;
                    })(),
                  }}
                >
                  <HeatmapCell step={r} onSaved={applyFresh} />
                </td>
                {/* Dev Type */}
                <td style={{ ...td, minWidth: 200 }}>
                  <DevTypeCell
                    step={r}
                    customDevTypes={safeCustomDevTypes}
                    onCustomDevTypesChange={setCustomDevTypes}
                    rows={rows ?? []}
                    applyFresh={applyFresh}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur
                          ? cur.map((x) =>
                              x.id === r.id ? { ...x, ...fresh } : x,
                            )
                          : cur,
                      )
                    }
                  />
                </td>

                {/* Planned Spend */}
                <td style={{ ...td, minWidth: "140px" }}>
                  <SpendCell
                    id={r.id}
                    field="planned_spend"
                    value={r.planned_spend}
                    spendEdits={spendEdits}
                    onEdit={(id, field, val) => {
                      setSpendEdits((prev) => ({
                        ...prev,
                        [id]: {
                          ...prev[id],
                          [field]: val,
                        },
                      }));
                    }}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur
                          ? cur.map((x) =>
                              x.id === r.id ? { ...x, ...fresh } : x,
                            )
                          : cur,
                      )
                    }
                  />
                </td>

                {/* Actual Spend */}
                <td style={{ ...td, minWidth: "140px" }}>
                  <SpendCell
                    id={r.id}
                    field="actual_spend"
                    value={r.actual_spend}
                    spendEdits={spendEdits}
                    onEdit={(id, field, val) => {
                      setSpendEdits((prev) => ({
                        ...prev,
                        [id]: {
                          ...prev[id],
                          [field]: val,
                        },
                      }));
                    }}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur
                          ? cur.map((x) =>
                              x.id === r.id ? { ...x, ...fresh } : x,
                            )
                          : cur,
                      )
                    }
                  />
                </td>

                {/* Start Date */}
                <td style={td}>
                  <DateCell
                    key={`start-${r.id}-${(r as any).start_date ?? ""}`}
                    value={(r as any).start_date}
                    onBlurValue={(iso) => handleDateUpdate(r, "start_date", iso)}
                  />
                </td>

                {/* End Date */}
                <td style={td}>
                  <DateCell
                    key={`end-${r.id}-${(r as any).end_date ?? ""}`}
                    value={(r as any).end_date}
                    onBlurValue={(iso) => handleDateUpdate(r, "end_date", iso)}
                  />
                </td>

                <td style={td}>
                  <input
                    key={`dur-${r.id}-${(r as any).duration_days ?? ""}`}
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={(r as any).duration_days ?? ""}
                    onBlur={(e) => {
                      const val = e.currentTarget.value;
                      if (!val) return;
                      handleDurationUpdate(r, val);
                    }}
                    style={{
                      width: "90px",
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                <td style={td}>
                  <RelatedActivityCell
                    step={r}
                    peers={sorted}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur
                          ? cur.map((x) =>
                              x.id === r.id ? { ...x, ...fresh } : x,
                            )
                          : cur,
                      )
                    }
                    onJumpToId={jumpToId}
                  />
                </td>
                {/* Owner */}
                <td style={td}>
                  <OwnerCell
                    step={r}
                    onSaved={applyFresh}
                    onContactSync={(org) =>
                      maybeCreateContact({
                        organization: org,
                        responsibility: "Owner",
                      })
                    }
                  />
                </td>
                <td style={td}>
                  <ResponsiblePartyCell
                    step={r}
                    onSaved={applyFresh}
                    onContactSync={(org) =>
                      maybeCreateContact({
                        organization: org,
                        responsibility: "Responsible Party",
                      })
                    }
                  />
                </td>
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={(r as any).responsible_individual ?? ""}
                    placeholder="Name"
                    title={(r as any).responsible_individual ?? ""}
                    onMouseEnter={(e) => {
                      e.currentTarget.title = e.currentTarget.value;
                    }}
                    onChange={syncTitle}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      const current = (r as any).responsible_individual ?? "";
                      if (val === current) return;
                      const orgFallback =
                        (r as any).responsible_party ||
                        (r as any).owner ||
                        null;
                      try {
                        const fresh = await updateStepMeta(r.id, {
                          responsible_individual: val || null,
                        });
                        applyFresh(fresh);
                        if (val && projectId) {
                          await maybeCreateContact({
                            organization: orgFallback,
                            name: val,
                            responsibility: "Responsible Individual",
                          });
                        }
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to update responsible individual.\n${err?.message ?? ""}`);
                      }
                    }}
                    style={{
                      width: "100%",
                      minWidth: 160,
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                    size={28}
                  />
                </td>
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={(r as any).process ?? ""}
                    placeholder="Process"
                    title={(r as any).process ?? ""}
                    onMouseEnter={(e) => {
                      e.currentTarget.title = e.currentTarget.value;
                    }}
                    onChange={syncTitle}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      const current = (r as any).process ?? "";
                      if (val === current) return;
                      try {
                        const fresh = await updateStepMeta(r.id, {
                          process: val || null,
                        });
                        applyFresh(fresh);
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to update process.\n${err?.message ?? ""}`);
                      }
                    }}
                    style={{
                      width: "100%",
                      minWidth: 180,
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                    size={32}
                  />
                </td>
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={(r as any).link ?? ""}
                    placeholder="Link"
                    title={(r as any).link ?? ""}
                    onMouseEnter={(e) => {
                      e.currentTarget.title = e.currentTarget.value;
                    }}
                    onChange={syncTitle}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      const current = (r as any).link ?? "";
                      if (val === current) return;
                      try {
                        const fresh = await updateStepMeta(r.id, {
                          link: val || null,
                        });
                        applyFresh(fresh);
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to update link.\n${err?.message ?? ""}`);
                      }
                    }}
                    style={{
                      width: "100%",
                      minWidth: 160,
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid " + "var(--border)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                    size={28}
                  />
                  {((r as any).link as string | undefined) ? (
                    <div style={{ marginTop: 6 }}>
                      <a href={(r as any).link as string} target="_blank" rel="noreferrer">
                        Open link
                      </a>
                    </div>
                  ) : null}
                </td>
              <td style={requirementTd}>
                <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={requirementList}>
                    {["Engineering", "Permitting/Compliance", "Financing"].map((opt) => {
                      const selected = new Set(requirementSets.get(r.id) ?? []);
                      const checked = selected.has(opt);
                      return (
                        <label key={opt} style={requirementLabel}>
                          <input
                            type="checkbox"
                            checked={checked}
                            style={requirementCheckbox}
                            onChange={async (e) => {
                              const next = new Set(selected);
                              if (e.target.checked) {
                                next.add(opt);
                              } else {
                                next.delete(opt);
                              }
                              const nextVal = Array.from(next).join(", ");
                              const payload: any = { requirement: nextVal || null };
                              const flagKey = REQUIREMENT_FLAG_KEYS[opt as RequirementLabel];
                              if (flagKey) {
                                payload[flagKey] = e.target.checked ? "X" : null;
                              }
                              try {
                                const fresh = await updateStepMeta(r.id, payload);
                                applyFresh(fresh);
                              } catch (err: any) {
                                console.error(err);
                                alert(`Failed to update requirement.\n${err?.message ?? ""}`);
                              }
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={requirementList}>
                    {["Interconnection", "Site Control", "Construction/Execution"].map((opt) => {
                      const selected = new Set(requirementSets.get(r.id) ?? []);
                      const checked = selected.has(opt);
                      return (
                        <label key={opt} style={requirementLabel}>
                          <input
                            type="checkbox"
                            checked={checked}
                            style={requirementCheckbox}
                            onChange={async (e) => {
                              const next = new Set(selected);
                              if (e.target.checked) {
                                next.add(opt);
                              } else {
                                next.delete(opt);
                              }
                              const nextVal = Array.from(next).join(", ");
                              const payload: any = { requirement: nextVal || null };
                              const flagKey = REQUIREMENT_FLAG_KEYS[opt as RequirementLabel];
                              if (flagKey) {
                                payload[flagKey] = e.target.checked ? "X" : null;
                              }
                              try {
                                const fresh = await updateStepMeta(r.id, payload);
                                applyFresh(fresh);
                              } catch (err: any) {
                                console.error(err);
                                alert(`Failed to update requirement.\n${err?.message ?? ""}`);
                              }
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </td>
                {/* Storage Hybrid Impact */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={(r as any).storage_hybrid_impact ?? ""}
                    placeholder="Storage hybrid impact"
                    title={(r as any).storage_hybrid_impact ?? ""}
                    onChange={syncTitle}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      const current = (r as any).storage_hybrid_impact ?? "";
                      if (val === current) return;
                      try {
                        const fresh = await updateStepMeta(r.id, { storage_hybrid_impact: val || null });
                        applyFresh(fresh);
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to update storage hybrid impact.\n${err?.message ?? ""}`);
                        e.currentTarget.value = current;
                      }
                    }}
                    style={{
                      width: "100%",
                      minWidth: 180,
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                    size={28}
                  />
                </td>

                {/* Milestones / NTP Gates (binary flag) */}
                <td style={{ ...td, textAlign: "center" }}>
                  {(() => {
                    const currentChecked = isCheckedFlag((r as any).milestones_ntp_gates);
                    return (
                      <input
                        type="checkbox"
                        checked={currentChecked}
                        aria-label="Milestones / NTP Gates"
                        onChange={async (e) => {
                          const nextChecked = e.target.checked;
                          const nextVal = nextChecked ? "X" : null;
                          try {
                            const fresh = await updateStepMeta(r.id, {
                              milestones_ntp_gates: nextVal,
                            });
                            applyFresh(fresh);
                          } catch (err: any) {
                            console.error(err);
                            alert(`Failed to update milestones / NTP gates.\n${err?.message ?? ""}`);
                            e.target.checked = currentChecked;
                          }
                        }}
                      />
                    );
                  })()}
                </td>

              <td style={{ ...td, whiteSpace: "nowrap", width: 100, minWidth: 100, textAlign: "center" }}>
                {customIds.has(r.id) || (r.name || "").toLowerCase().includes("custom") ? (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={async () => {
                      const ok = window.confirm("Delete this activity? This cannot be undone.");
                      if (!ok) return;
                      try {
                        await deleteDevelopmentStep(r.id);
                        setRows((cur) => (cur ? cur.filter((x) => x.id !== r.id) : cur));
                        setCustomIds((prev) => {
                          const next = new Set(prev);
                          next.delete(r.id);
                          return next;
                        });
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to delete activity.\n${err?.message ?? ""}`);
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {showAddForm ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              borderRadius: 8,
              border: "1px solid var(--border)",
              padding: "10px 12px",
              background: "var(--table-row)",
            }}
          >
            <input
              id="new-activity-name"
              type="text"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              placeholder="Activity name"
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                minWidth: 220,
                fontSize: 13,
              }}
            />
            <select
              value={newActivityPhase === "" ? "" : String(newActivityPhase)}
              onChange={(e) => {
                const raw = e.target.value as "" | "1" | "2" | "3";
                setNewActivityPhase(raw === "" ? "" : (Number(raw) as 1 | 2 | 3));
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 13,
                minWidth: 160,
                background:
                  "var(--table-row) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d8ae52' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 8px center",
                backgroundSize: "10px",
                paddingRight: 26,
              }}
            >
              <option value="">Phase (optional)</option>
              <option value="1">Early</option>
              <option value="2">Mid</option>
              <option value="3">Late</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleAddActivity}
                disabled={addSaving}
                style={{
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--accent-weak)",
                  color: "var(--text)",
                  cursor: addSaving ? "default" : "pointer",
                  opacity: addSaving ? 0.7 : 1,
                }}
              >
                {addSaving ? "Saving..." : "Save Activity"}
              </button>
              <button
                type="button"
                onClick={resetAddForm}
                disabled={addSaving}
                style={{
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                  fontSize: 13,
                  background: "transparent",
                  color: "var(--text)",
                  cursor: addSaving ? "default" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              if (typeof document !== "undefined") {
                setTimeout(() => {
                  const el = document.getElementById("new-activity-name");
                  if (el instanceof HTMLInputElement) {
                    el.focus();
                  }
                }, 0);
              }
            }}
            style={{
              borderRadius: 6,
              border: "1px solid var(--border)",
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--table-row)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            + Activity
          </button>
        )}
      </div>
      <datalist id="contact-orgs">
        {contactOrgs.map((org) => (
          <option key={org} value={org} />
        ))}
      </datalist>
    </div>
  );
}
