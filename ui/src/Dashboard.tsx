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
            border: "1px solid var(--danger)",
            background: "rgba(248, 113, 113, 0.12)",
            color: "var(--danger)",
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

  const permittingSteps = useMemo(
    () =>
      (steps ?? []).filter(
        (s) => (s.development_type || "").toLowerCase() === "permitting",
      ),
    [steps],
  );

  const milestoneSteps = useMemo(() => {
    const flagIsChecked = (val: unknown) => {
      if (val === undefined || val === null) return false;
      const lower = String(val).trim().toLowerCase();
      return ["y", "yes", "x", "true", "1"].includes(lower);
    };
    return (steps ?? []).filter((s) =>
      flagIsChecked((s as any).milestones_ntp_gates),
    );
  }, [steps]);

  const redRiskSteps = useMemo(() => {
    return (steps ?? []).filter((s) => {
      const heat = ((s as any).risk_heatmap ?? "").toString().toLowerCase();
      const status = (s.status ?? "").toString();
      const isRed = heat === "red";
      const isCompleted = status === "Completed";
      return isRed && !isCompleted;
    });
  }, [steps]);

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

  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId)
      .then((p) => setCurrentProject(p))
      .catch((e) => console.warn("Failed to refresh project on dashboard", e));
  }, [projectId, setCurrentProject]);

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "var(--muted)", fontSize: 14 }}>
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
      {project && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h1 className="page-title" style={{ marginBottom: 8 }}>
                {project.project_name}
              </h1>
              <h2 className="page-subtitle">Dashboard</h2>
              {steps === null && (
                <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>
                  Loading latest project data...
                </div>
              )}
            </div>
            <div
              className="print-hidden"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <SaveAsPdfButton />
              <img
                src="/landcharge-logo.png"
                alt="Land Charge"
                style={{ height: 72, width: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 24,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>AC / DC Size</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{sizeLabel}</div>
            </div>
            <div
              style={{
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>County / State</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{location}</div>
            </div>
            <div
              style={{
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Offtake Structure</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{offtake}</div>
            </div>
            <div
              style={{
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Project Type</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{projectType}</div>
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
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                Lease Option Start Date
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{leaseStart}</div>
            </div>
            <div
              style={{
                background: "var(--table-row)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 220,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                Lease Option Expiration Date
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{leaseEnd}</div>
            </div>
          </div>
        </>
      )}

      <ChartErrorBoundary title="Requirement progress">
        <DevTypeProgressRow steps={safeSteps} />
      </ChartErrorBoundary>

      <ChartErrorBoundary title="Development timeline">
        <DevTypeGanttChart steps={safeSteps} />
      </ChartErrorBoundary>

      <ChartErrorBoundary title="Budget vs actual">
        <DevTypeSpendChart steps={safeSteps} />
      </ChartErrorBoundary>

      {/* Milestones / NTP Gates (binary) */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--card)",
          padding: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Milestones / NTP Gates (Binary)
        </div>
        {milestoneSteps.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            No milestone flags (Milestones / NTP Gates = Y) yet.
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
              <thead style={{ background: "var(--table-row)" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Milestone
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {milestoneSteps.map((m) => {
                  const status = (m.status ?? "").toString();
                  let icon = "[ ]";
                  let label = "Open";
                  let color = "#ef4444";
                  if (status === "Completed") {
                    icon = "[x]";
                    label = "Complete";
                    color = "#059669";
                  } else if (status === "Not Applicable") {
                    icon = "";
                    label = "N/A";
                    color = "var(--muted)";
                  }
                  return (
                    <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text)" }}>{m.name}</td>
                      <td style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, color }}>
                        {icon ? (
                          <span aria-hidden="true" style={{ fontSize: 14 }}>
                            {icon}
                          </span>
                        ) : null}
                        <span style={{ color }}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open RED Risks */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--card)",
          padding: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Open RED Risks (Auto-Filtered)
        </div>
        {redRiskSteps.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No open RED risks.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead style={{ background: "var(--table-row)" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Activity
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Phase
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Dev Type
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                    Duration (Days)
                  </th>
                </tr>
              </thead>
              <tbody>
                {redRiskSteps.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "8px 10px" }}>{(r as any).phase ?? "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{r.development_type ?? "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {(r as any).duration_days ?? "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--card)",
            padding: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Permit Matrix
          </div>
          {permittingSteps.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
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
                <thead style={{ background: "var(--table-row)" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>Activity</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>Start</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>End</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>Agency</th>
                  </tr>
                </thead>
                <tbody>
                  {permittingSteps.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "8px 10px" }}>{p.status ?? "N/A"}</td>
                      <td style={{ padding: "8px 10px" }}>{(p as any).start_date ?? "N/A"}</td>
                      <td style={{ padding: "8px 10px" }}>{(p as any).end_date ?? "N/A"}</td>
                      <td style={{ padding: "8px 10px" }}>{(p as any).agency ?? "N/A"}</td>
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
