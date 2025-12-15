// ui/src/ProjectSummaryPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "./types";
import { fetchProjects, createProject, deleteProject, updateProject } from "./api";
import { useProject } from "./ProjectContext";
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";

// Project type options map directly to the four template CSVs
const PROJECT_TYPE_OPTIONS = [
  "",
  "BTM Rooftop",
  "BTM Ground",
  "FTM Rooftop Community Solar",
  "FTM Ground Community Solar",
];
const OFFTAKE_STRUCTURE_OPTIONS = ["", "FTM_UTIL", "FTM_DIST", "BTM"];
const STATE_OPTIONS = ["", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
const PROJECT_TYPE_SET = new Set(PROJECT_TYPE_OPTIONS.filter(Boolean));

function deriveProjectType(p: Project): Project["project_type"] {
  const detail = (p.project_details ?? "").toUpperCase();
  const offtake = (p.offtake_structure ?? "").toUpperCase();
  const isRooftop = detail.includes("ROOF");
  const isBTM = offtake === "BTM";
  const isFTM = offtake.startsWith("FTM");

  if (isBTM) return isRooftop ? "BTM Rooftop" : "BTM Ground";
  if (isFTM) return isRooftop ? "FTM Rooftop Community Solar" : "FTM Ground Community Solar";
  if (isRooftop) return "FTM Rooftop Community Solar";
  return "FTM Ground Community Solar";
}

export default function ProjectSummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { selectProject, projectId: selectedProjectId, setCurrentProject } = useProject();

  async function maybeRemapProjectTypes(rows: Project[]): Promise<Project[]> {
    const updatedRows = [...rows];
    await Promise.all(
      rows.map(async (p, idx) => {
        if (p.project_type && PROJECT_TYPE_SET.has(p.project_type)) {
          return;
        }
        const nextType = deriveProjectType(p);
        if (!nextType || nextType === p.project_type) return;
        try {
          const fresh = await updateProject(p.id, { project_type: nextType });
          updatedRows[idx] = fresh;
        } catch (e) {
          console.warn(`Failed to remap project ${p.id} type`, e);
        }
      }),
    );
    return updatedRows;
  }

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((rows) => maybeRemapProjectTypes(rows))
      .then((rows) => setProjects(rows))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleNewProject() {
    try {
      const fresh = await createProject({});
      
      // Bootstrap development steps for the new project
      try {
        const apiBase = import.meta.env.VITE_API_URL;
        if (!apiBase) {
          throw new Error("VITE_API_URL is not set.");
        }
        const bootstrapRes = await fetch(`${apiBase}/projects/${fresh.id}/bootstrap_steps/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!bootstrapRes.ok) {
          console.warn("Bootstrap steps failed, but project was created");
        }
      } catch (e) {
        console.warn("Could not bootstrap steps:", e);
      }
      
      setProjects((prev) => [...prev, fresh]);
    } catch (e: any) {
      alert(`Failed to create project.\n${e?.message ?? ""}`);
    }
  }

  function handleSelectProject(projectId: number) {
    selectProject(projectId);
    navigate("/dashboard");
  }

  async function handleDeleteProject(projectId: number) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (e: any) {
      alert(`Failed to delete project.\n${e?.message ?? ""}`);
    }
  }

  async function handleUpdateProjectName(projectId: number, newName: string) {
    if (!newName.trim()) {
      alert("Project name cannot be empty");
      return;
    }
    try {
      const updated = await updateProject(projectId, { project_name: newName });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      if (selectedProjectId === projectId) {
        setCurrentProject(updated);
      }
    } catch (e: any) {
      alert(`Failed to update project name.\n${e?.message ?? ""}`);
    }
  }

  async function handleUpdateProject(
    projectId: number,
    updates: Partial<Project>
  ) {
    try {
      const updated = await updateProject(projectId, updates);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      if (selectedProjectId === projectId) {
        setCurrentProject(updated);
      }
    } catch (e: any) {
      alert(`Failed to update project.\n${e?.message ?? ""}`);
    }
  }

  const canDeleteProjects = projects.length > 1;

  if (err) return <div className="page-root">Error: {err}</div>;
  if (loading) return <div className="page-root">Loading projects...</div>;

  return (
    <div className="page-root">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 className="page-title">Project Portfolio</h1>
        <div className="print-hidden" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SaveAsPdfButton style={{ marginRight: 4 }} />
          <img
            src={logo}
            alt="Land Charge"
            style={{ height: 60, width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>
      <p style={{ margin: "4px 0 16px", color: "#374151", fontSize: 12, lineHeight: 1.4 }}>
        Please use this tool to plan and manage pre-construction projects.
        <br />
        Disclaimer: [App Name] supports project workflow and planning but does not replace professional judgment. Users are responsible for managing, reviewing, and validating all project information and decisions.
      </p>
      <div style={{ height: 12 }} />

      <button
        type="button"
        onClick={handleNewProject}
        style={{
          marginBottom: 16,
          borderRadius: 5,
          border: "1px solid #d1d5db",
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 500,
          background: "#ffffff",
          color: "#374151",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
        }}
      >
        + Add Project
      </button>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflowX: "auto",
          overflowY: "visible",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: 13,
            width: "max-content",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>Project Name</th>
              <th style={th}>Legal Name</th>
              <th style={th}>Project Type</th>
              <th style={th}>Offtake Structure</th>
              <th style={th}>AC (MW)</th>
              <th style={th}>DC (MW)</th>
              <th style={th}>Lease Option Start</th>
              <th style={th}>Lease Option Expiration</th>
              <th style={th}>Lat</th>
              <th style={th}>Lon</th>
              <th style={th}>State</th>
              <th style={th}>County</th>
              <th style={th}>City</th>
              <th style={th}>Address</th>
              <th style={th}>Other</th>
              <th style={{ ...th, position: "sticky", right: 0, background: "#f9fafb", borderLeft: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                {/* Project Name */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.project_name}
                    onBlur={(e) => {
                      const newName = e.currentTarget.value;
                      if (newName && newName !== p.project_name) {
                        handleUpdateProjectName(p.id, newName);
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Legal Name */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.legal_name}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value;
                      if (newVal && newVal !== p.legal_name) {
                        handleUpdateProject(p.id, { legal_name: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Type - Dropdown */}
                <td style={td}>
                  <select
                    defaultValue={p.project_type || ""}
                    onChange={(e) => {
                      const newVal = e.target.value || null;
                      if (newVal !== p.project_type) {
                        handleUpdateProject(p.id, { project_type: newVal });
                      }
                    }}
                    style={selectStyle}
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "--"}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Offtake - Dropdown */}
                <td style={td}>
                  <select
                    defaultValue={p.offtake_structure || ""}
                    onChange={(e) => {
                      const newVal = e.target.value || null;
                      if (newVal !== p.offtake_structure) {
                        handleUpdateProject(p.id, { offtake_structure: newVal });
                      }
                    }}
                    style={selectStyle}
                  >
                    {OFFTAKE_STRUCTURE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "--"}
                      </option>
                    ))}
                  </select>
                </td>
                {/* AC Size */}
                <td style={td}>
                  <input
                    type="number"
                    step="0.001"
                    defaultValue={p.size_ac_mw || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value ? Number(e.currentTarget.value) : null;
                      if (newVal !== p.size_ac_mw) {
                        handleUpdateProject(p.id, { size_ac_mw: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* DC Size */}
                <td style={td}>
                  <input
                    type="number"
                    step="0.001"
                    defaultValue={p.size_dc_mw || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value ? Number(e.currentTarget.value) : null;
                      if (newVal !== p.size_dc_mw) {
                        handleUpdateProject(p.id, { size_dc_mw: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Lease Option Start */}
                <td style={td}>
                  <input
                    type="date"
                    defaultValue={(p as any).lease_option_start_date || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== (p as any).lease_option_start_date) {
                        handleUpdateProject(p.id, { lease_option_start_date: newVal as any });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Lease Option Expiration */}
                <td style={td}>
                  <input
                    type="date"
                    defaultValue={(p as any).lease_option_expiration_date || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== (p as any).lease_option_expiration_date) {
                        handleUpdateProject(p.id, { lease_option_expiration_date: newVal as any });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Latitude */}
                <td style={td}>
                  <input
                    type="number"
                    step="0.000001"
                    defaultValue={p.latitude || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value ? Number(e.currentTarget.value) : null;
                      if (newVal !== p.latitude) {
                        handleUpdateProject(p.id, { latitude: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Longitude */}
                <td style={td}>
                  <input
                    type="number"
                    step="0.000001"
                    defaultValue={p.longitude || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value ? Number(e.currentTarget.value) : null;
                      if (newVal !== p.longitude) {
                        handleUpdateProject(p.id, { longitude: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* State - Dropdown */}
                <td style={td}>
                  <select
                    defaultValue={p.state || ""}
                    onChange={(e) => {
                      const newVal = e.target.value || null;
                      if (newVal !== p.state) {
                        handleUpdateProject(p.id, { state: newVal });
                      }
                    }}
                    style={selectStyle}
                  >
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "--"}
                      </option>
                    ))}
                  </select>
                </td>
                {/* County */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.county || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== p.county) {
                        handleUpdateProject(p.id, { county: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* City */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.city || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== p.city) {
                        handleUpdateProject(p.id, { city: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Address */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.address || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== p.address) {
                        handleUpdateProject(p.id, { address: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Other */}
                <td style={td}>
                  <input
                    type="text"
                    defaultValue={p.other || ""}
                    onBlur={(e) => {
                      const newVal = e.currentTarget.value || null;
                      if (newVal !== p.other) {
                        handleUpdateProject(p.id, { other: newVal });
                      }
                    }}
                    style={inputStyle}
                  />
                </td>
                {/* Actions */}
                <td style={actionsTd}>
                  <button
                    onClick={() => handleSelectProject(p.id)}
                    style={{
                      padding: "5px 10px",
                      background: "white",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      marginRight: 6,
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "white";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    style={{
                      padding: "5px 10px",
                      background: "#fee2e2",
                      color: "#7f1d1d",
                      border: "1px solid #fecaca",
                      borderRadius: 5,
                      cursor: canDeleteProjects ? "pointer" : "default",
                      fontSize: 12,
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                      opacity: canDeleteProjects ? 1 : 0.4,
                    }}
                    onMouseOver={(e) => {
                      if (!canDeleteProjects) return;
                      (e.currentTarget as HTMLButtonElement).style.background = "#fecaca";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                    }}
                    onMouseOut={(e) => {
                      if (!canDeleteProjects) return;
                      (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 12,
  color: "#6b7280",
  background: "#f3f4f6",
  border: "none",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  borderBottom: "1px solid #e5e7eb",
  minWidth: 120,
  fontSize: 13,
  color: "#1f2937",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: 5,
  fontSize: 13,
  boxSizing: "border-box",
  background: "white",
  color: "#1f2937",
  transition: "all 0.15s ease",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  paddingRight: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 5,
  fontSize: 13,
  boxSizing: "border-box",
  background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\") no-repeat right 6px center",
  backgroundSize: "10px",
  color: "#1f2937",
  cursor: "pointer",
  appearance: "none" as any,
};

const actionsTd: React.CSSProperties = {
  ...td,
  position: "sticky",
  right: 0,
  background: "#ffffff",
  borderLeft: "1px solid #e5e7eb",
  minWidth: 140,
};
