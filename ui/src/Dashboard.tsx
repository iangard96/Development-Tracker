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
                    color = "#6b7280";
                  }
                  return (
                    <tr key={m.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#111827" }}>{m.name}</td>
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
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#ffffff",
          padding: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Open RED Risks (Auto-Filtered)
        </div>
        {redRiskSteps.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>No open RED risks.</div>
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
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>
                    Activity
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>
                    Phase
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>
                    Dev Type
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>
                    Duration (Days)
                  </th>
                </tr>
              </thead>
              <tbody>
                {redRiskSteps.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
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
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6b7280" }}>Agency</th>
                  </tr>
                </thead>
                <tbody>
                  {permittingSteps.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
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
