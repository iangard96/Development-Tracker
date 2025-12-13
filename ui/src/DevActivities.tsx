// ui/src/DevActivities.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { DevStep, DevType } from "./types";
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
} from "./api";
import { useProject } from "./ProjectContext";
import SaveAsPdfButton from "./SaveAsPdfButton";

const th: React.CSSProperties = {
  textAlign: "left",
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 12,
  paddingRight: 12,
  fontWeight: 600,
  fontSize: 12,
  color: "#6b7280",
  position: "sticky",
  top: 0,
  background: "#f9fafb",
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
  background: "#ffffff",
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
const sortBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  cursor: "pointer",
};

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
        border: "1px solid #e5e7eb",
        borderRadius: 5,
        fontSize: 13,
        background: "white",
        color: "#1f2937",
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
        border: "1px solid #e5e7eb",
        borderRadius: 5,
        background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "#1f2937",
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
          border: "1px solid #d1d5db",
          fontSize: 13,
          color: "#111827",
          background:
            "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 10px center",
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
        border: "1px solid #e5e7eb",
        borderRadius: 5,
        background:
          "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "#1f2937",
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
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
}) {
  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    const nextVal = raw === "" ? null : raw;
    const prevVal = (step as any).responsible_party ?? null;

    // Optimistically update the row so selection sticks
    onSaved({ ...(step as any), responsible_party: nextVal } as DevStep);

    try {
      const fresh = await updateStepMeta(step.id, { responsible_party: nextVal });
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      // revert on failure
      onSaved({ ...(step as any), responsible_party: prevVal } as DevStep);
      alert(`Failed to update responsible party.\n${err?.message ?? ""}`);
    }
  }

  return (
    <select
      value={(step as any).responsible_party ?? ""}
      onChange={onChange}
      style={{
        padding: "6px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 5,
        background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
        backgroundSize: "10px",
        paddingRight: 24,
        fontSize: 13,
        color: "#1f2937",
        cursor: "pointer",
        appearance: "none" as any,
      }}
    >
      <option value="">Select</option>
      <option value="Internal">Internal</option>
      <option value="3rd Party Contracted">3rd Party Contracted</option>
    </select>
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
        border: "1px solid #d1d5db",
        fontSize: 14,
        fontWeight: 500,
        background: "white",
        color: "#111827",
        boxSizing: "border-box",
        textAlign: "right",
      }}
    />
  );
}

export default function DevActivities() {
  const { projectId, project } = useProject();
  const [rows, setRows] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devTypeFilter, setDevTypeFilter] = useState<DevType | "ALL">("ALL");
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
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [contactsMeta, setContactsMeta] = useState<
    { id: number; organization: string; name: string }
  >([]);
  const [contactOrgs, setContactOrgs] = useState<string[]>([]);

  const applyFresh = (fresh: DevStep) =>
    setRows((cur) =>
      cur
        ? cur.map((x) => (x.id === fresh.id ? { ...x, ...fresh } : x))
        : cur,
    );

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

  if (!projectId) {
    return (
      <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Summary to edit its development activities.
      </div>
    );
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const base = [...rows].sort(
      (a: any, b: any) =>
        (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id,
    );
    const byType =
      devTypeFilter === "ALL"
        ? base
        : base.filter((r) => (r.development_type ?? "") === devTypeFilter);

    const byPhase =
      phaseFilter === "ALL"
        ? byType
        : byType.filter((r) => {
            const ph = (r as any).phase ?? null;
            return ph === phaseFilter;
          });

    if (!searchTerm.trim()) return byPhase;
    const q = searchTerm.toLowerCase();
    return byPhase.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, devTypeFilter, phaseFilter, searchTerm]);

  const sorted = useMemo(() => {
    const list = [...filtered];
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

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const resetSort = () => {
    setSortBy(null);
    setSortDir("asc");
  };

  if (err)
    return <div style={{ color: "red", padding: 16 }}>Error: {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Loading...</div>;

  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

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
      const base = new Date(start);
      if (!Number.isNaN(+base)) {
        base.setDate(base.getDate() + durationNum);
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
      const base = new Date(end);
      if (!Number.isNaN(+base)) {
        base.setDate(base.getDate() - durationNum);
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
        cur ? cur.map((x) => (x.id === row.id ? { ...x, ...fresh } : x)) : cur,
      );
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update date.\n${err?.message ?? ""}`);
    }
  };

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
      {project && (
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111827", margin: "0 0 32px" }}>
          {project.project_name}
        </h1>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }} className="print-hidden">
        <SaveAsPdfButton />
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
        <h2 style={{ fontSize: 16, fontWeight: 500, color: "#374151", margin: 0 }}>
          Development Activities
        </h2>
        <div className="print-hidden" style={{ display: "flex", gap: 8 }}>
          {sortBy && (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Sorted by {sortBy.replace("_", " ")} ({sortDir})
            </div>
          )}
          <button
            type="button"
            onClick={resetSort}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
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
              border: "1px solid #e5e7eb",
              fontSize: 13,
              background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
              backgroundSize: "10px",
              paddingRight: 24,
              color: "#1f2937",
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by activity name"
            style={{
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              color: "#1f2937",
              background: "white",
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
              border: "1px solid #e5e7eb",
              fontSize: 13,
              background:
                "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
              backgroundSize: "10px",
              paddingRight: 24,
              color: "#1f2937",
              cursor: "pointer",
              appearance: "none" as any,
            }}
          >
            <option value="ALL">All</option>
            <option value={1}>Pre Dev</option>
            <option value={2}>Dev</option>
            <option value={3}>Pre Con</option>
          </select>
        </label>
      </div>

      <div
        style={{
          overflow: "auto",
          maxHeight: "70vh",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "linear-gradient(#f9fafb 0 52px, #ffffff 52px)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          position: "relative",
        }}
        ref={tableContainerRef}
      >
        <table
          style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ ...th, display: "none" }}>#</th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("status")}>
                  Status {sortBy === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("phase")}>
                  Phase {sortBy === "phase" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={{ ...th, ...stickyActivity }}>
                <button style={sortBtn} onClick={() => toggleSort("name")}>
                  Activity {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={{ ...th, minWidth: 200 }}>Dev Type</th>
              <th style={{ ...th, minWidth: "140px" }}>
                <button style={sortBtn} onClick={() => toggleSort("planned_spend")}>
                  Planned Spend ($) {sortBy === "planned_spend" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={{ ...th, minWidth: "140px" }}>
                <button style={sortBtn} onClick={() => toggleSort("actual_spend")}>
                  Actual Spend ($) {sortBy === "actual_spend" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("start_date")}>
                  Start Date {sortBy === "start_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("end_date")}>
                  End Date {sortBy === "end_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={th}>
                <button style={sortBtn} onClick={() => toggleSort("duration_days")}>
                  Duration (Days) {sortBy === "duration_days" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
              <th style={th}>Purpose / Related Activity</th>
              <th style={th}>Agency</th>
              <th style={th}>Responsible Party</th>
              <th style={th}>Responsible Individual</th>
              <th style={th}>Process</th>
              <th style={th}>Link</th>
              <th style={{ ...th, ...requirementTh }}>Requirement</th>
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
                style={{
                  borderTop: "1px solid #e5e7eb",
                  background: highlighted.has(r.id) ? "#e0f2fe" : undefined,
                  transition: "background 0.3s ease",
                }}
              >
                {(() => {
                  const isCustom =
                    customIds.has(r.id) ||
                    (r.name || "").toLowerCase().includes("custom");
                  return null;
                })()}
                <td style={{ ...td, display: "none" }}>{(r as any).sequence ?? i + 1}</td>

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
                    const phaseLabel =
                      phaseVal === 1
                        ? "Pre Dev"
                        : phaseVal === 2
                          ? "Dev"
                          : phaseVal === 3
                            ? "Pre Con"
                            : "--";

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
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                          boxSizing: "border-box",
                          background:
                            "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
                          backgroundSize: "10px",
                          paddingRight: 24,
                        }}
                      >
                        <option value="">--</option>
                        <option value="1">Pre Dev</option>
                        <option value="2">Dev</option>
                        <option value="3">Pre Con</option>
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
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                    );
                  })()}
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
                    value={(r as any).start_date}
                    onBlurValue={(iso) => handleDateUpdate(r, "start_date", iso)}
                  />
                </td>

                {/* End Date */}
                <td style={td}>
                  <DateCell
                    value={(r as any).end_date}
                    onBlurValue={(iso) => handleDateUpdate(r, "end_date", iso)}
                  />
                </td>

                <td style={td}>{(r as any).duration_days ?? ""}</td>

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
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={(r as any).agency ?? ""}
                    placeholder="Agency / Org"
                    title={(r as any).agency ?? ""}
                    list="agency-options"
                    onMouseEnter={(e) => {
                      e.currentTarget.title = e.currentTarget.value;
                    }}
                    onChange={syncTitle}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      const current = (r as any).agency ?? "";
                      if (val === current) return;
                      try {
                        const fresh = await updateStepMeta(r.id, {
                          agency: val || null,
                        });
                        applyFresh(fresh);
                        if (val && projectId) {
                          await maybeCreateContact({
                            organization: val,
                            name: null,
                          });
                        }
                      } catch (err: any) {
                        console.error(err);
                        alert(`Failed to update agency.\n${err?.message ?? ""}`);
                      }
                    }}
                    style={{
                      width: "100%",
                      minWidth: 160,
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                    size={28}
                  />
                </td>
                <td style={td}>
                  <ResponsiblePartyCell
                    step={r}
                    onSaved={applyFresh}
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
                      const agencyVal = (r as any).agency ?? "";
                      try {
                        const fresh = await updateStepMeta(r.id, {
                          responsible_individual: val || null,
                        });
                        applyFresh(fresh);
                        // Create contact only if new org+name combo
                        if (val && projectId) {
                          await maybeCreateContact({
                            organization: agencyVal || undefined,
                            name: val,
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
                      border: "1px solid #e5e7eb",
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
                      border: "1px solid #e5e7eb",
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
                      border: "1px solid " + "#e5e7eb",
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
                <div style={requirementList}>
                  {["Engineering", "Permitting/Compliance", "Financing", "Interconnection"].map((opt) => {
                    const requirementVal = (r as any).requirement ?? "";
                    const selected = new Set(
                        requirementVal
                          .split(",")
                          .map((s: string) => s.trim())
                          .filter(Boolean),
                      );
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
                              try {
                                const fresh = await updateStepMeta(r.id, { requirement: nextVal || null });
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
              </td>
              <td style={{ ...td, whiteSpace: "nowrap", width: 100, minWidth: 100, textAlign: "center" }}>
                {customIds.has(r.id) || (r.name || "").toLowerCase().includes("custom") ? (
                  <button
                    type="button"
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
                    style={{
                      border: "1px solid #fecaca",
                      background: "#fee2e2",
                      color: "#7f1d1d",
                      borderRadius: 5,
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={async () => {
            if (!projectId) return;
            const name = window.prompt("Activity name?");
            const trimmed = (name || "").trim();
            if (!trimmed) return;
            const phaseInput = window.prompt("Phase number (optional)?");
            const phaseVal = phaseInput && phaseInput.trim() !== "" ? Number(phaseInput) : null;
            try {
              const created = await createDevelopmentStep({
                project: Number(projectId),
                name: trimmed,
                phase: isNaN(phaseVal as any) ? null : phaseVal,
              });
              setRows((cur) => (cur ? [...cur, created] : [created]));
              setCustomIds((prev) => new Set(prev).add(created.id));
            } catch (e: any) {
              console.error(e);
              alert(`Failed to add activity.\n${e?.message ?? ""}`);
            }
          }}
          style={{
            borderRadius: 6,
            border: "1px solid #d1d5db",
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            background: "#f9fafb",
            color: "#1f2937",
            cursor: "pointer",
          }}
        >
          + Activity
        </button>
      </div>
      {/* agency suggestions */}
      <datalist id="agency-options">
        {contactOrgs.map((org) => (
          <option key={org} value={org} />
        ))}
      </datalist>
    </div>
  );
}
