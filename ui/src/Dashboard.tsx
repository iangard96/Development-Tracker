// ui/src/Dashboard.tsx
import { Component, ReactNode, useEffect, useMemo, useState } from "react";
import { fetchProject, fetchStepsForProject } from "./api";
import DevTypeProgressRow from "./DevTypeProgressRow";
import DevTypeSpendChart from "./DevTypeSpendChart";
import DevTypeGanttChart from "./DevTypeGanttChart";
import LocationMap from "./LocationMap";
import type { DevStep } from "./types";
import { useProject } from "./ProjectContext";
import SaveAsPdfButton from "./SaveAsPdfButton";

class ChartErrorBoundary extends Component<
  { title: string; children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { title: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  componentDidCatch(error: unknown) {
    console.warn("Chart error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            border: "1px solid #fee2e2",
            background: "#fff1f2",
            color: "#991b1b",
            padding: 12,
            borderRadius: 10,
            margin: "16px 0",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {this.props.title} failed to load
          </div>
          <div style={{ fontSize: 12 }}>{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const { projectId, project, setCurrentProject } = useProject();
  const [steps, setSteps] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Always call hooks (useMemo) on every render to avoid hook order issues
  const permittingSteps = useMemo(
    () =>
      (steps ?? []).filter(
        (s) => (s.development_type || "").toLowerCase() === "permitting",
      ),
    [steps],
  );

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

  // Refresh the selected project when landing on the dashboard so lease dates and other
  // fields reflect the latest saves from Project Summary.
  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId)
      .then((p) => setCurrentProject(p))
      .catch((e) => console.warn("Failed to refresh project on dashboard", e));
  }, [projectId, setCurrentProject]);

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

  const safeSteps = Array.isArray(steps) ? steps : [];

  const fmtSize = (ac: number | null | undefined, dc: number | null | undefined) => {
    const acLabel = ac !== null && ac !== undefined ? `${ac} AC` : "N/A";
    const dcLabel = dc !== null && dc !== undefined ? `${dc} DC` : "N/A";
    return `${acLabel} / ${dcLabel}`;
  };

  const projectType = project?.project_type ?? "N/A";
  const offtake = project?.offtake_structure ?? "N/A";
  const location =
    project && (project.county || project.state)
      ? `${project.county ?? ""}${project.county && project.state ? ", " : ""}${project.state ?? ""}`
      : "N/A";
  const sizeLabel = fmtSize(project?.size_ac_mw, project?.size_dc_mw);
  const leaseStart = (project as any)?.lease_option_start_date || "N/A";
  const leaseEnd = (project as any)?.lease_option_expiration_date || "N/A";

  return (
    <div className="page-root">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }} className="print-hidden">
        <SaveAsPdfButton />
      </div>
      {project && (
        <>
          {steps === null && (
            <div style={{ marginBottom: 8, fontSize: 13, color: "#6b7280" }}>
              Loading latest project data...
            </div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>
            {project.project_name}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
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
                minWidth: 220,
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
                minWidth: 220,
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
                minWidth: 220,
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
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Project Type</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{projectType}</div>
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
      <ChartErrorBoundary title="Development type progress">
        <DevTypeProgressRow steps={safeSteps} />
      </ChartErrorBoundary>

      {/* 2. Gantt chart under the gauges */}
      <ChartErrorBoundary title="Development timeline">
        <DevTypeGanttChart steps={safeSteps} />
      </ChartErrorBoundary>

      {/* 3. Budget vs Actual spend under the Gantt */}
      <ChartErrorBoundary title="Budget vs actual">
        <DevTypeSpendChart steps={safeSteps} />
      </ChartErrorBoundary>

      {/* Map and permit matrix side-by-side */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div style={{ flex: 1, minWidth: 320, maxWidth: "52%" }}>
          <LocationMap project={project ?? null} />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 320,
            maxWidth: "48%",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#ffffff",
            padding: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            Permit Matrix
          </div>
          {permittingSteps.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              No permitting activities yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead style={{ background: "#f9fafb" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>Activity</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>Start</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>End</th>
                  </tr>
                </thead>
                <tbody>
                  {permittingSteps.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "8px 10px" }}>{p.status ?? "N/A"}</td>
                      <td style={{ padding: "8px 10px" }}>{(p as any).start_date ?? "N/A"}</td>
                      <td style={{ padding: "8px 10px" }}>{(p as any).end_date ?? "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
