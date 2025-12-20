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
  { id: -1, project: null as any, level: "Federal", applicable: "Y", agency: "FAA", required_permit: "Coordination / Concurrence" },
  { id: -2, project: null as any, level: "Federal", applicable: "Y", agency: "US Army Corps of Engineers", required_permit: "Wetland Delineation Concurrence" },
  { id: -3, project: null as any, level: "Federal", applicable: "N", agency: "US Army Corps of Engineers", required_permit: "Section 404 Permit  - Utility Regional General Permit, NWP 51, Individual Permit, Permit for Navigable Stream Crossings" },
  { id: -4, project: null as any, level: "Federal", applicable: "Y", agency: "USFWS", required_permit: "Endangered Species/Resources Consultation (ESA)" },
  { id: -5, project: null as any, level: "Federal", applicable: "Y", agency: "USFWS", required_permit: "Migratory Bird Treat Act Compliance (MBTA)" },
  { id: -6, project: null as any, level: "Federal", applicable: "N", agency: "USFWS", required_permit: "Eagle Take Permits" },
  { id: -7, project: null as any, level: "State", applicable: "Y", agency: "SHPO", required_permit: "Cultural/archaeological/historic resources concurrence" },
  { id: -8, project: null as any, level: "State", applicable: "N", agency: "State Historical Society", required_permit: "Section 106 National Historic Preservation Act Compliance (NHPA)" },
  { id: -9, project: null as any, level: "State", applicable: "N", agency: "PSC/PUC", required_permit: "Certificate of Public Convenience, Use, and Necessity (CPCN)" },
  { id: -10, project: null as any, level: "State", applicable: "Y", agency: "DNR", required_permit: "State Threatened & Endangered Plants and Wildlife Concurrence" },
  { id: -11, project: null as any, level: "State", applicable: "Y", agency: "DNR", required_permit: "WPDES Permit WIS067831-6 (Construction Site Stormwater Runoff General Permit)" },
  { id: -12, project: null as any, level: "State", applicable: "N", agency: "DNR", required_permit: "GP3" },
  { id: -13, project: null as any, level: "State", applicable: "N", agency: "DOT", required_permit: "Road Right-of-Way Permit" },
  { id: -14, project: null as any, level: "State", applicable: "Y", agency: "Utility", required_permit: "Interconnection Agreement" },
  { id: -16, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Zoning Permit" },
  { id: -17, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Building Permit" },
  { id: -18, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Electrical Permit" },
  { id: -19, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Building Permit" },
  { id: -20, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Shoreland Permit" },
  { id: -21, project: null as any, level: "Local", applicable: "N", agency: "AHJ (County, City, Township)**", required_permit: "Wetlands, Floodplain Permit" },
  { id: -22, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Right-of-Way Permit" },
  { id: -23, project: null as any, level: "Local", applicable: "N", agency: "AHJ (County, City, Township)**", required_permit: "Stormwater & Erosion Control Permit / Erosion & Sediment Permit" },
  { id: -24, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Culvert Permit" },
  { id: -25, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Electrical Permit" },
  { id: -26, project: null as any, level: "Local", applicable: "N", agency: "AHJ (County, City, Township)**", required_permit: "Fence Permit" },
  { id: -27, project: null as any, level: "Local", applicable: "Y", agency: "AHJ (County, City, Township)**", required_permit: "Highway Permit" },
  { id: -28, project: null as any, level: "Local", applicable: "", agency: "AHJ (County, City, Township)**", required_permit: "no permit, but need to relocate" },
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

type EditablePermit = Omit<PermitRequirement, "id" | "project"> & { id?: number };

export default function Permitting() {
  const { projectId, project } = useProject();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permits, setPermits] = useState<PermitRequirement[]>(TEMPLATE_PERMITS);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number | "new", EditablePermit>>({});
  const [bootstrappedProjectId, setBootstrappedProjectId] = useState<number | null>(null);

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
          setPermits(data.length ? data : TEMPLATE_PERMITS);
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

  function startEdit(row: PermitRequirement) {
    setEditingRow(row.id);
    setDrafts((d) => ({ ...d, [row.id]: { ...row } }));
  }

  function stopEdit() {
    setEditingRow(null);
  }

  function updateDraft(id: number | "new", key: keyof EditablePermit, value: string) {
    setDrafts((d) => {
      const current = d[id] || (permits.find((p) => p.id === id) as EditablePermit | undefined) || {};
      const next: EditablePermit = { ...current, [key]: value };

      const toDate = (v: string | null | undefined) => {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(+d) ? null : d;
      };

      const start = toDate(next.start_date as any);
      const completion = toDate(next.completion_date as any);

      if (key === "start_date" || key === "completion_date") {
        if (start && completion) {
          const diffMs = completion.getTime() - start.getTime();
          const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
          next.turnaround_days = Number.isFinite(days) ? days : (next.turnaround_days as any);
        }
      }

      if (key === "turnaround_days") {
        const days = Number(value);
        if (start && Number.isFinite(days)) {
          const calc = new Date(start);
          calc.setDate(calc.getDate() + days);
          const iso = calc.toISOString().slice(0, 10);
          next.completion_date = iso as any;
        }
      }

      return { ...d, [id]: next };
    });
  }

  function isApplicableChecked(value: string | null | undefined): boolean {
    if (!value) return false;
    return String(value).trim().toUpperCase() === "Y";
  }

  async function saveRow(rowId: number) {
    const draft = drafts[rowId];
    if (!draft) {
      setEditingRow(null);
      return;
    }
    try {
      const payload: Partial<PermitRequirement> = { ...draft, project: projectId! } as any;
      const updated =
        rowId < 0
          ? await createPermitRequirement(payload)
          : await updatePermitRequirement(rowId, payload);
      setPermits((rows) => rows.map((r) => (r.id === rowId ? updated : r)));
      if (rowId < 0) {
        setPermits((rows) => rows.map((r) => (r.id === rowId ? updated : r)));
      }
      setEditingRow(null);
    } catch (e: any) {
      setError(String(e));
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
      setPermits((rows) => [...rows, created]);
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

  if (!projectId) {
    return <div style={{ padding: 16, color: "#6b7280" }}>Select a project to view permitting.</div>;
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
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
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
      {loading && <div style={{ fontSize: 12, color: "#6b7280" }}>Loading…</div>}
      {error && <div style={{ fontSize: 12, color: "crimson" }}>{error}</div>}

      {levels.map((level) => (
        <section key={level} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{level}</div>
            <button type="button" style={ghostButton} onClick={() => addRow(level)}>Add Row</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, minWidth: 900 }}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} style={theadCell}>{c.label}</th>
                  ))}
                  <th style={theadCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[level] || []).map((row) => {
                  const isEditing = editingRow === row.id;
                  const draft = (drafts[row.id] || row) as any;
                  return (
                    <tr key={row.id}>
                      {columns.map((c) => (
                        <td key={c.key} style={tbodyCell}>
                          {isEditing ? (
                            c.key === "applicable" ? (
                              <input
                                type="checkbox"
                                checked={isApplicableChecked(draft[c.key])}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.checked ? "Y" : "N")}
                              />
                            ) : c.key === "start_date" || c.key === "completion_date" ? (
                              <input
                                type="date"
                                value={draft[c.key] ? String(draft[c.key]).slice(0, 10) : ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={cellInput}
                              />
                            ) : c.key === "turnaround_days" ? (
                              <input
                                type="number"
                                value={draft[c.key] ?? ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={cellInput}
                              />
                            ) : c.key === "fee" ? (
                              <input
                                type="number"
                                step="0.01"
                                value={draft[c.key] ?? ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={cellInput}
                              />
                            ) : c.key === "requirements" || c.key === "comments" ? (
                              <textarea
                                value={draft[c.key] ?? ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={{ ...cellInput, minWidth: 240, minHeight: 60, resize: "vertical" }}
                              />
                            ) : c.key === "agency_phone" ? (
                              <input
                                type="tel"
                                value={draft[c.key] ?? ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={cellInput}
                              />
                            ) : (
                              <input
                                type="text"
                                value={draft[c.key] ?? ""}
                                onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                                style={cellInput}
                              />
                            )
                          ) : (
                            c.key === "applicable" ? (
                              <input
                                type="checkbox"
                                checked={isApplicableChecked(row[c.key as keyof PermitRequirement] as any)}
                                onChange={(e) => toggleApplicable(row, e.target.checked)}
                              />
                            ) : (
                              <span>{row[c.key as keyof PermitRequirement] as any}</span>
                            )
                          )}
                        </td>
                      ))}
                      <td style={tbodyCell}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={smallButton} onClick={() => saveRow(row.id)}>Save</button>
                            <button style={smallButton} onClick={stopEdit}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={smallButton} onClick={() => startEdit(row)}>Edit</button>
                            <button style={smallButton} onClick={() => deleteRow(row.id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!grouped[level] || grouped[level].length === 0) && (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ ...tbodyCell, textAlign: "center", color: "#6b7280" }}>
                      No rows yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

const searchInput: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  minWidth: 240,
  fontSize: 13,
};

const ghostButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  cursor: "pointer",
};

const theadCell: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 12,
  color: "#6b7280",
  background: "#f9fafb",
};

const tbodyCell: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 12,
  color: "#111827",
  verticalAlign: "top",
  maxWidth: 220,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cellInput: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 12,
};

const smallButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};
