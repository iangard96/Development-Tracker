// ui/src/Permitting.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "./ProjectContext";
import {
  fetchPermitRequirements,
  createPermitRequirement,
  updatePermitRequirement,
  deletePermitRequirement,
  bootstrapPermitRequirements,
} from "./api";
import type { PermitRequirement } from "./types";

const TEMPLATE_PERMITS: PermitRequirement[] = [
  { id: -1, project: null as any, level: "Federal", applicable: "", agency: "FAA", required_permit: "Coordination / Concurrence" },
  { id: -2, project: null as any, level: "Federal", applicable: "", agency: "US Army Corps of Engineers", required_permit: "Wetland Delineation Concurrence" },
  { id: -3, project: null as any, level: "Federal", applicable: "", agency: "US Army Corps of Engineers", required_permit: "Section 404 Permit  - Utility Regional General Permit, NWP 51, Individual Permit, Permit for Navigable Stream Crossings" },
  { id: -4, project: null as any, level: "Federal", applicable: "", agency: "USFWS", required_permit: "Endangered Species/Resources Consultation (ESA)" },
  { id: -5, project: null as any, level: "Federal", applicable: "", agency: "USFWS", required_permit: "Migratory Bird Treat Act Compliance (MBTA)" },
  { id: -6, project: null as any, level: "Federal", applicable: "", agency: "USFWS", required_permit: "Eagle Take Permits" },
  { id: -7, project: null as any, level: "State", applicable: "", agency: "SHPO", required_permit: "Cultural/archaeological/historic resources concurrence" },
  { id: -8, project: null as any, level: "State", applicable: "", agency: "State Historical Society", required_permit: "Section 106 National Historic Preservation Act Compliance (NHPA)" },
  { id: -9, project: null as any, level: "State", applicable: "", agency: "PSC/PUC", required_permit: "Certificate of Public Convenience, Use, and Necessity (CPCN)" },
  { id: -10, project: null as any, level: "State", applicable: "", agency: "DNR", required_permit: "State Threatened & Endangered Plants and Wildlife Concurrence" },
  { id: -11, project: null as any, level: "State", applicable: "", agency: "DNR", required_permit: "WPDES Permit WIS067831-6 (Construction Site Stormwater Runoff General Permit)" },
  { id: -12, project: null as any, level: "State", applicable: "", agency: "DNR", required_permit: "GP3" },
  { id: -13, project: null as any, level: "State", applicable: "", agency: "DOT", required_permit: "Road Right-of-Way Permit" },
  { id: -14, project: null as any, level: "State", applicable: "", agency: "Utility", required_permit: "Interconnection Agreement" },
  { id: -16, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Zoning Permit" },
  { id: -17, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Building Permit" },
  { id: -18, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Electrical Permit" },
  { id: -19, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Building Permit" },
  { id: -20, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Shoreland Permit" },
  { id: -21, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Wetlands, Floodplain Permit" },
  { id: -22, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Right-of-Way Permit" },
  { id: -23, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Stormwater & Erosion Control Permit / Erosion & Sediment Permit" },
  { id: -24, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Culvert Permit" },
  { id: -25, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Electrical Permit" },
  { id: -26, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Fence Permit" },
  { id: -27, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "Highway Permit" },
].map((row) => ({
  ...row,
  includes: "",
  cup_condition: "",
  responsible_party: "",
  responsible_individual: "",
  status: "",
  fee: "",
  start_date: null,
  turnaround_days: null,
  completion_date: null,
  agency_contact: "",
  agency_phone: "",
  requirements: "",
  approval_doc_link: "",
  comments: "",
}));

const columns = [
  { key: "applicable", label: "Applicable" },
  { key: "agency", label: "Agency" },
  { key: "required_permit", label: "Permit/Concurrence" },
  { key: "includes", label: "Includes" },
  { key: "cup_condition", label: "CUP Condition" },
  { key: "responsible_party", label: "Resp. Party" },
  { key: "responsible_individual", label: "Resp. Individual" },
  { key: "status", label: "Status" },
  { key: "fee", label: "Fee" },
  { key: "start_date", label: "Start" },
  { key: "turnaround_days", label: "Turnaround (days)" },
  { key: "completion_date", label: "Completion" },
  { key: "agency_contact", label: "Agency Contact" },
  { key: "agency_phone", label: "Phone" },
  { key: "requirements", label: "Requirements" },
  { key: "approval_doc_link", label: "Approval Doc" },
  { key: "comments", label: "Comments" },
];

const levels = ["Federal", "State", "Local"];
const TEMPLATE_SIGNATURES = new Set(
  TEMPLATE_PERMITS.map(
    (r) =>
      `${(r.level || "").toLowerCase()}|${(r.agency || "").toLowerCase()}|${(r.required_permit || "").toLowerCase()}`,
  ),
);

const columnWidths: Record<string, number> = {
  applicable: 80,
  agency: 160,
  required_permit: 220,
  includes: 140,
  cup_condition: 140,
  responsible_party: 140,
  responsible_individual: 140,
  status: 140,
  fee: 120,
  start_date: 140,
  turnaround_days: 130,
  completion_date: 140,
  agency_contact: 150,
  agency_phone: 140,
  requirements: 240,
  approval_doc_link: 140,
  comments: 240,
  actions: 140,
};

type EditablePermit = Omit<PermitRequirement, "id" | "project"> & { id?: number };

function stripApplicable(rows: PermitRequirement[]): PermitRequirement[] {
  return rows.map((r) => ({ ...r, applicable: "" }));
}

function cleanPermits(rows: PermitRequirement[]): PermitRequirement[] {
  const disallowed = new Set(["permit", "no permit, but need to relocate"]);
  return stripApplicable(
    rows.filter((r) => !disallowed.has(String(r.required_permit || "").trim().toLowerCase())),
  );
}

export default function Permitting() {
  const { projectId, project } = useProject();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permits, setPermits] = useState<PermitRequirement[]>(cleanPermits(TEMPLATE_PERMITS));
  const [bootstrappedProjectId, setBootstrappedProjectId] = useState<number | null>(null);
  const [collapsedLevels, setCollapsedLevels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (bootstrappedProjectId !== projectId) {
          await bootstrapPermitRequirements(projectId);
          if (!cancelled) {
            setBootstrappedProjectId(projectId);
          }
        }
        const data = await fetchPermitRequirements(projectId, undefined, search);
        if (!cancelled) {
          const next = data.length ? cleanPermits(data) : cleanPermits(TEMPLATE_PERMITS);
          setPermits(next);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, search, bootstrappedProjectId]);

  function isApplicableChecked(value: string | null | undefined): boolean {
    if (!value) return false;
    return String(value).trim().toUpperCase() === "Y";
  }

  function normalizeDateInput(value: string | null | undefined): string {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const d = new Date(String(value));
    if (isNaN(+d)) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function applyDateCalculations(
    base: EditablePermit,
    key: keyof EditablePermit,
    rawValue: string | number | null,
  ): EditablePermit {
    const next: EditablePermit = { ...base, [key]: rawValue as any };

    const toDate = (v: any) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(+d) ? null : d;
    };

    const start = toDate(next.start_date);
    const completion = toDate(next.completion_date);

    if (key === "start_date" || key === "completion_date") {
      if (start && completion) {
        const diffMs = completion.getTime() - start.getTime();
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
        next.turnaround_days = Number.isFinite(days) ? days : (next.turnaround_days as any);
      }
    }

    if (key === "turnaround_days") {
      const days = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (start && Number.isFinite(days)) {
        const calc = new Date(start);
        calc.setDate(calc.getDate() + days);
        const iso = calc.toISOString().slice(0, 10);
        next.completion_date = iso as any;
      }
    }

    return next;
  }

  async function updateField(row: PermitRequirement, key: keyof EditablePermit, raw: any) {
    const original = { ...row } as EditablePermit;

    let value: any = raw;
    if (key === "start_date" || key === "completion_date") {
      value = raw || null;
    }
    if (key === "applicable" && (value === undefined || value === null)) {
      value = "";
    }
    if (key === "turnaround_days") {
      value = raw === "" || raw === null ? null : Number(raw);
      if (!Number.isFinite(value as number)) value = null;
    }

    const updated = applyDateCalculations({ ...original, [key]: value }, key, value);
    setPermits((rows) => rows.map((r) => (r.id === row.id ? ({ ...r, ...updated } as PermitRequirement) : r)));

    if (!projectId) return;

    try {
      if (row.id < 0) {
        const payload: any = { ...updated, project: projectId };
        delete payload.id;
        const created = await createPermitRequirement(payload);
        setPermits((rows) => rows.map((r) => (r.id === row.id ? { ...created, applicable: "" } : r)));
        return;
      }

      const payload: Partial<PermitRequirement> = {};
      payload[key as keyof PermitRequirement] = value as any;
      if (key === "start_date" || key === "completion_date") {
        payload.start_date = updated.start_date as any;
        payload.completion_date = updated.completion_date as any;
        payload.turnaround_days = updated.turnaround_days as any;
      }
      if (key === "turnaround_days") {
        payload.turnaround_days = updated.turnaround_days as any;
        payload.completion_date = updated.completion_date as any;
      }
      const saved = await updatePermitRequirement(row.id, payload);
      setPermits((rows) => rows.map((r) => (r.id === row.id ? saved : r)));
    } catch (e: any) {
      setError(String(e));
      setPermits((rows) => rows.map((r) => (r.id === row.id ? (original as PermitRequirement) : r)));
    }
  }

  async function deleteRow(rowId: number) {
    if (!window.confirm("Delete this permitting row?")) return;
    try {
      if (rowId >= 0) {
        await deletePermitRequirement(rowId);
      }
      setPermits((rows) => rows.filter((r) => r.id !== rowId));
    } catch (e: any) {
      setError(String(e));
    }
  }

  async function toggleApplicable(row: PermitRequirement, checked: boolean) {
    const nextVal = checked ? "Y" : "N";
    setPermits((rows) => rows.map((r) => (r.id === row.id ? { ...r, applicable: nextVal } : r)));
    if (!projectId) return;
    if (row.id < 0) {
      return;
    }
    try {
      const updated = await updatePermitRequirement(row.id, { applicable: nextVal });
      setPermits((rows) => rows.map((r) => (r.id === row.id ? updated : r)));
    } catch (e: any) {
      setError(String(e));
      setPermits((rows) => rows.map((r) => (r.id === row.id ? row : r)));
    }
  }

  async function addRow(level: string) {
    if (!projectId) return;
    try {
      const payload: Partial<PermitRequirement> = {
        project: projectId,
        level,
        required_permit: "New permit",
      } as any;
      const created = await createPermitRequirement(payload);
      setPermits((rows) => cleanPermits([...rows, { ...created, applicable: "" }]));
    } catch (e: any) {
      setError(String(e));
    }
  }

  const grouped = useMemo(() => {
    const byLevel: Record<string, PermitRequirement[]> = { Federal: [], State: [], Local: [] };
    permits.forEach((p) => {
      const key = levels.find((lvl) => lvl.toLowerCase() === (p.level || "").toLowerCase()) || "Local";
      byLevel[key].push(p);
    });
    return byLevel;
  }, [permits]);

  function toggleLevel(level: string) {
    setCollapsedLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  }

  const isTemplateRow = (row: PermitRequirement) => {
    const sig = `${(row.level || "").toLowerCase()}|${(row.agency || "").toLowerCase()}|${(row.required_permit || "").toLowerCase()}`;
    return TEMPLATE_SIGNATURES.has(sig);
  };

  if (!projectId) {
    return <div style={{ padding: 16, color: "var(--muted)" }}>Select a project to view permitting.</div>;
  }

  return (
    <div className="page-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 4,
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{project?.project_name || "Project"}</h1>
          <h2 className="page-subtitle" style={{ margin: "0 0 4px" }}>Permitting</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            Track federal, state, and local permitting requirements.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search permits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />
        </div>
      </div>
      {loading && <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading…</div>}
      {error && <div style={{ fontSize: 12, color: "crimson" }}>{error}</div>}

      {levels.map((level) => (
        <section key={level} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 , flexWrap: "wrap" }}>
              <button
                type="button"
                style={toggleButton}
                onClick={() => toggleLevel(level)}
                aria-label={`Toggle ${level} section`}
              >
                <span aria-hidden="true">{collapsedLevels[level] ? "▼" : "▲"}</span>
                {collapsedLevels[level] ? "Expand" : "Collapse"}
              </button>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{level}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={ghostButton}
                onClick={() => addRow(level)}
              >
                Add Row
              </button>
            </div>
          </div>
          {!collapsedLevels[level] && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, minWidth: 900, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  {columns.map((c) => {
                    const width = columnWidths[c.key] || 140;
                    return (
                      <th key={c.key} style={{ ...theadCell, minWidth: width, width }}>
                        {c.label}
                      </th>
                    );
                  })}
                  <th style={{ ...theadCell, minWidth: columnWidths["actions"], width: columnWidths["actions"] }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[level] || []).map((row) => {
                  const canDelete = row.id >= 0 && !isTemplateRow(row);
                  return (
                    <tr key={row.id}>
                      {columns.map((c) => (
                        <td key={c.key} style={{ ...tbodyCell, minWidth: columnWidths[c.key] || 140, width: columnWidths[c.key] || 140 }}>
                          {c.key === "applicable" ? (
                            <input
                              type="checkbox"
                              checked={isApplicableChecked(row[c.key as keyof PermitRequirement] as any)}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.checked ? "Y" : "N")}
                            />
                          ) : c.key === "required_permit" ? (
                            <span style={{ display: "block", minWidth: columnWidths[c.key] || 140 }}>
                              {row[c.key as keyof PermitRequirement] as any}
                            </span>
                          ) : c.key === "start_date" || c.key === "completion_date" ? (
                            <input
                              type="date"
                              value={normalizeDateInput(row[c.key as keyof PermitRequirement] as any)}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value || null)}
                              style={{ ...cellInput, minWidth: columnWidths[c.key] || 140 }}
                            />
                          ) : c.key === "turnaround_days" ? (
                            <input
                              type="number"
                              value={row[c.key as keyof PermitRequirement] ?? ""}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value)}
                              style={{ ...cellInput, minWidth: columnWidths[c.key] || 130 }}
                            />
                          ) : c.key === "fee" ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row[c.key as keyof PermitRequirement] ?? ""}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value)}
                              style={{ ...cellInput, minWidth: columnWidths[c.key] || 120 }}
                            />
                          ) : c.key === "requirements" || c.key === "comments" ? (
                            <textarea
                              value={row[c.key as keyof PermitRequirement] ?? ""}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value)}
                              rows={2}
                              style={{
                                ...cellInput,
                                minWidth: columnWidths[c.key] || 220,
                                minHeight: 48,
                                resize: "vertical",
                                overflowY: "auto",
                              }}
                            />
                          ) : c.key === "agency_phone" ? (
                            <input
                              type="tel"
                              value={row[c.key as keyof PermitRequirement] ?? ""}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value)}
                              style={{ ...cellInput, minWidth: columnWidths[c.key] || 140 }}
                            />
                          ) : (
                            <input
                              type="text"
                              value={row[c.key as keyof PermitRequirement] ?? ""}
                              onChange={(e) => updateField(row, c.key as keyof EditablePermit, e.target.value)}
                              style={{ ...cellInput, minWidth: columnWidths[c.key] || 140 }}
                            />
                          )}
                        </td>
                      ))}
                      <td style={{ ...tbodyCell, minWidth: columnWidths["actions"], width: columnWidths["actions"] }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {canDelete ? (
                            <button className="btn-delete" onClick={() => deleteRow(row.id)}>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!grouped[level] || grouped[level].length === 0) && (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ ...tbodyCell, textAlign: "center", color: "var(--muted)" }}>
                      No rows yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </section>
      ))}
    </div>
  );
}

const searchInput: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  minWidth: 240,
  fontSize: 13,
  background: "var(--table-row)",
  color: "var(--text)",
};

const ghostButton: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card)",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text)",
  cursor: "pointer",
};

const toggleButton: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--surface)",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const theadCell: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: "1px solid var(--border)",
  fontSize: 12,
  color: "var(--muted)",
  background: "var(--table-row)",
};

const tbodyCell: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: "1px solid var(--surface)",
  fontSize: 12,
  color: "var(--text)",
  verticalAlign: "top",
  maxWidth: 320,
  whiteSpace: "normal",
  overflow: "auto",
};

const cellInput: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
  background: "var(--table-row)",
  color: "var(--text)",
};

const smallButton: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card)",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};
