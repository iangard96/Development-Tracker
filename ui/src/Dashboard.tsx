// ui/src/Dashboard.tsx
import { useEffect, useState } from "react";
import { fetchStepsForProject } from "./api";
import DevTypeProgressRow from "./DevTypeProgressRow";
import DevTypeSpendChart from "./DevTypeSpendChart";
import DevTypeGanttChart from "./DevTypeGanttChart";
import LocationMap from "./LocationMap";
import type { DevStep } from "./types";
import { useProject } from "./ProjectContext";

export default function Dashboard() {
  const { projectId, project } = useProject();
  const [steps, setSteps] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setSteps(null);
      setErr(null);
      return;
    }

    setSteps(null);
    setErr(null);
    fetchStepsForProject(projectId)
      .then((rows: DevStep[]) => setSteps(rows))
      .catch((e) => setErr(String(e)));
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Summary to view its dashboard.
      </div>
    );
  }

  if (err) {
    return (
      <div className="page-root" style={{ color: "crimson" }}>
        Error: {err}
      </div>
    );
  }

  if (!steps) {
    return <div className="page-root">Loading...</div>;
  }

  const fmtSize = (ac: number | null | undefined, dc: number | null | undefined) => {
    const acLabel = ac !== null && ac !== undefined ? `${ac} AC` : "—";
    const dcLabel = dc !== null && dc !== undefined ? `${dc} DC` : "—";
    return `${acLabel} / ${dcLabel}`;
  };

  const projectType = project?.project_type ?? "—";
  const projectDetails = project?.project_details ?? "—";
  const offtake = project?.offtake_structure ?? "—";
  const location =
    project && (project.county || project.state)
      ? `${project.county ?? ""}${project.county && project.state ? ", " : ""}${project.state ?? ""}`
      : "—";
  const sizeLabel = fmtSize(project?.size_ac_mw, project?.size_dc_mw);
  const leaseStart = (project as any)?.lease_option_start_date || "—";
  const leaseEnd = (project as any)?.lease_option_expiration_date || "—";

  return (
    <div className="page-root">
      {project && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>
            {project.project_name}
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>AC / DC Size</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{sizeLabel}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>County / State</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{location}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Offtake Structure</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{offtake}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Project Type</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{projectType}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Project Details</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{projectDetails}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Lease Option Start Date
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{leaseStart}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Lease Option Expiration Date
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{leaseEnd}</div>
            </div>
          </div>
        </>
      )}
      {/* 1. Top row: 3 circular gauges (should also use project-scoped data internally) */}
      <DevTypeProgressRow steps={steps} />

      {/* 2. Gantt chart under the gauges */}
      <DevTypeGanttChart steps={steps} />

      {/* 3. Budget vs Actual spend under the Gantt */}
      <DevTypeSpendChart steps={steps} />

      {/* 4. Map view */}
      <LocationMap project={project ?? null} />
    </div>
  );
}
