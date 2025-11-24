// ui/src/ProjectSummary.tsx
import { useEffect, useState } from "react";
import type { Project } from "./types";
import { fetchProjects, createProject, updateProject, deleteProject } from "./api";

const PT_OPTIONS = [
  { v: "GM", label: "Ground-Mount" },
  { v: "RT", label: "Rooftop" },
  { v: "OT", label: "Other" },
] as const;

const PD_OPTIONS = [
  { v: "GM_FIXED", label: "gm-fixed" },
  { v: "GM_TRACK", label: "gm-tracking" },
  { v: "BALLASTED", label: "ballasted" },
  { v: "ROOFTOP", label: "rooftop" },
] as const;

const OF_OPTIONS = [
  { v: "FTM_UTIL", label: "FTM-Utility" },
  { v: "FTM_DIST", label: "FTM-Distributed" },
  { v: "BTM", label: "BTM" },
] as const;

// Normalize DRF list responses: [] OR { results: [] }
function asArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

function displayName(name: string | null | undefined, kind: "project" | "legal") {
  if (!name) return "";
  const projectRe = /^New Project \d+$/;
  const legalRe   = /^New Legal Entity \d+$/;

  if (kind === "project" && projectRe.test(name)) return "New Project";
  if (kind === "legal" && legalRe.test(name)) return "New Legal Entity";
  return name;
}

export default function ProjectSummary() {
  const [rows, setRows] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProjects();
        setRows(asArray<Project>(data));
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addRow() {
    try {
      const stamp = Date.now(); // ✅ ensure uniqueness for any UNIQUE constraints
      const created = await createProject({
        project_name: `New Project ${stamp}`,
        legal_name: `New Legal Entity ${stamp}`,

        // ✅ optional: set coded defaults so row matches DB enum style
        project_type: "RT",
        project_details: "GM_FIXED",
        offtake_structure: "FTM_UTIL",
        size_ac_mw: 5.0,
      });
      setRows((r) => [created, ...r]);
    } catch (e) {
      console.error(e);
      alert("Failed to create project.");
    }
  }

  async function onEdit(id: number, patch: Partial<Project>) {
    const prev = rows;
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next);
    setSaving(id);
    try {
      await updateProject(id, patch);
    } catch (e) {
      console.error(e);
      setRows(prev);
      alert("Failed to save change.");
    } finally {
      setSaving(null);
    }
  }

  async function removeRow(id: number) {
    if (!confirm("Delete this project?")) return;
    const prev = rows;
    setRows(prev.filter((r) => r.id !== id));
    try {
      await deleteProject(id);
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
      setRows(prev);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ color: "crimson", padding: 16 }}>Error: {err}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Project Summary</h1>

      <button
        onClick={addRow}
        style={{ marginBottom: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
      >
        + Add Project
      </button>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <Th>Project Name</Th>
              <Th>Legal Name</Th>
              <Th>Project Type</Th>
              <Th>Project Details</Th>
              <Th>Offtake Structure</Th>
              <Th>AC (MW)</Th>
              <Th>DC (MW)</Th>
              <Th>Lat</Th>
              <Th>Lon</Th>
              <Th>State</Th>
              <Th>County</Th>
              <Th>City</Th>
              <Th>Address</Th>
              <Th>Other</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <Td>
                  <input
                    value={r.project_name, "project"}
                    onChange={(e) => onEdit(r.id, { project_name: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    value={r.legal_name, "legal"}
                    onChange={(e) => onEdit(r.id, { legal_name: e.target.value })}
                  />
                </Td>

                <Td>
                  <select
                    value={r.project_type ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { project_type: (e.target.value || null) as Project["project_type"] })
                    }
                  >
                    <option value="">—</option>
                    {PT_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Td>

                <Td>
                  <select
                    value={r.project_details ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { project_details: (e.target.value || null) as Project["project_details"] })
                    }
                  >
                    <option value="">—</option>
                    {PD_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Td>

                <Td>
                  <select
                    value={r.offtake_structure ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, {
                        offtake_structure: (e.target.value || null) as Project["offtake_structure"],
                      })
                    }
                  >
                    <option value="">—</option>
                    {OF_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Td>

                <TdNum>
                  <input
                    type="number"
                    step="0.001"
                    value={r.size_ac_mw ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { size_ac_mw: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </TdNum>

                <TdNum>
                  <input
                    type="number"
                    step="0.001"
                    value={r.size_dc_mw ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { size_dc_mw: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </TdNum>

                <TdNum>
                  <input
                    type="number"
                    step="0.000001"
                    value={r.latitude ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { latitude: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </TdNum>

                <TdNum>
                  <input
                    type="number"
                    step="0.000001"
                    value={r.longitude ?? ""}
                    onChange={(e) =>
                      onEdit(r.id, { longitude: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </TdNum>

                <TdNarrow>
                  <input
                    maxLength={2}
                    value={r.state ?? ""}
                    onChange={(e) => onEdit(r.id, { state: e.target.value.toUpperCase() })}
                  />
                </TdNarrow>

                <Td>
                  <input value={r.county ?? ""} onChange={(e) => onEdit(r.id, { county: e.target.value })} />
                </Td>
                <Td>
                  <input value={r.city ?? ""} onChange={(e) => onEdit(r.id, { city: e.target.value })} />
                </Td>
                <Td>
                  <input value={r.address ?? ""} onChange={(e) => onEdit(r.id, { address: e.target.value })} />
                </Td>
                <Td>
                  <input value={r.other ?? ""} onChange={(e) => onEdit(r.id, { other: e.target.value })} />
                </Td>

                <Td style={{ textAlign: "right" }}>
                  <button
                    disabled={saving === r.id}
                    onClick={() => removeRow(r.id)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd" }}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>{children}</th>;
}
function Td({ children, style }: { children: any; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "8px 10px", borderTop: "1px solid #e5e7eb", verticalAlign: "middle", ...style }}>
      {children}
    </td>
  );
}
const TdNum: React.FC<{ children: any }> = ({ children }) => <Td style={{ minWidth: 110 }}>{children}</Td>;
const TdNarrow: React.FC<{ children: any }> = ({ children }) => <Td style={{ minWidth: 80 }}>{children}</Td>;
