// ui/src/Permitting.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "./ProjectContext";
import {
  fetchPermitRequirements,
  createPermitRequirement,
  updatePermitRequirement,
  deletePermitRequirement,
  seedPermitRequirements,
} from "./api";
import type { PermitRequirement } from "./types";

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
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permits, setPermits] = useState<PermitRequirement[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number | "new", EditablePermit>>({});

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetchPermitRequirements(projectId, undefined, search)
      .then(setPermits)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectId, search]);

  async function seedFromTemplate(force = false) {
    if (!projectId) return;
    if (!force && permits.length > 0) {
      const confirm = window.confirm("Permits already exist. Seed will be skipped unless you force replace. Continue?");
      if (!confirm) return;
    }
    setSeeding(true);
    setError(null);
    try {
      await seedPermitRequirements(projectId, force);
      // reload after seed
      const data = await fetchPermitRequirements(projectId, undefined, search);
      setPermits(data);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setSeeding(false);
    }
  }

  function startEdit(row: PermitRequirement) {
    setEditingRow(row.id);
    setDrafts((d) => ({ ...d, [row.id]: { ...row } }));
  }

  function stopEdit() {
    setEditingRow(null);
  }

  function updateDraft(id: number | "new", key: keyof EditablePermit, value: string) {
    setDrafts((d) => ({
      ...d,
      [id]: { ...(d[id] || {}), [key]: value },
    }));
  }

  async function saveRow(rowId: number) {
    const draft = drafts[rowId];
    if (!draft) {
      setEditingRow(null);
      return;
    }
    try {
      const payload: Partial<PermitRequirement> = { ...draft, project: projectId! } as any;
      const updated = await updatePermitRequirement(rowId, payload);
      setPermits((rows) => rows.map((r) => (r.id === rowId ? updated : r)));
      setEditingRow(null);
    } catch (e: any) {
      setError(String(e));
    }
  }

  async function deleteRow(rowId: number) {
    if (!window.confirm("Delete this permitting row?")) return;
    try {
      await deletePermitRequirement(rowId);
      setPermits((rows) => rows.filter((r) => r.id !== rowId));
    } catch (e: any) {
      setError(String(e));
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
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{project?.project_name || "Project"} - Permitting</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Track federal, state, and local permitting requirements.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search permits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={ghostButton} onClick={() => seedFromTemplate(false)} disabled={seeding}>
            {seeding ? "Seeding..." : "Seed from Template"}
          </button>
          <button
            type="button"
            style={ghostButton}
            onClick={() => seedFromTemplate(true)}
            disabled={seeding}
            title="Replace existing rows with template data"
          >
            Force Reseed
          </button>
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
                            <input
                              type="text"
                              value={draft[c.key] ?? ""}
                              onChange={(e) => updateDraft(row.id, c.key as keyof EditablePermit, e.target.value)}
                              style={cellInput}
                            />
                          ) : (
                            <span>{row[c.key as keyof PermitRequirement] as any}</span>
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
