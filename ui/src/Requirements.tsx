// ui/src/Requirements.tsx
import { useEffect, useMemo, useState } from "react";
import type { DevStep } from "./types";
import { fetchStepsForProject } from "./api";
import { useProject } from "./ProjectContext";
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";

const REQUIREMENT_BUCKETS = ["Financing", "Permitting/Compliance", "Engineering", "Interconnection"] as const;
type RequirementBucket = (typeof REQUIREMENT_BUCKETS)[number];

type GroupedRequirements = Record<RequirementBucket, DevStep[]>;

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 9999,
  background: "#eef2ff",
  color: "#4338ca",
  fontWeight: 600,
  fontSize: 12,
};

const subText: React.CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: 13,
};

const tableContainer: React.CSSProperties = {
  overflowX: "auto",
};

function parseRequirement(raw: string | null | undefined): RequirementBucket[] {
  if (!raw) return [];
  const tokens = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const matched = new Set<RequirementBucket>();
  tokens.forEach((t) => {
    const lower = t.toLowerCase();
    if (lower.startsWith("finance") || lower.includes("financ")) {
      matched.add("Financing");
    }
    if (lower.startsWith("permit") || lower.includes("compliance")) {
      matched.add("Permitting/Compliance");
    }
    if (lower.startsWith("engineer")) matched.add("Engineering");
    if (lower.includes("interconnection") || lower.includes("interconnect")) {
      matched.add("Interconnection");
    }
  });
  return Array.from(matched);
}

function sortSteps(list: DevStep[]): DevStep[] {
  return [...list].sort(
    (a: any, b: any) =>
      (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id,
  );
}

export default function Requirements() {
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
      .then(setSteps)
      .catch((e) => setErr(String(e)));
  }, [projectId]);

  const grouped: GroupedRequirements = useMemo(() => {
    const base: GroupedRequirements = {
      Financing: [],
      "Permitting/Compliance": [],
      Engineering: [],
      Interconnection: [],
    };
    (steps ?? []).forEach((step) => {
      const matches = parseRequirement((step as any).requirement);
      matches.forEach((bucket) => {
        base[bucket].push(step);
      });
    });
    REQUIREMENT_BUCKETS.forEach((bucket) => {
      base[bucket] = sortSteps(base[bucket]);
    });
    return base;
  }, [steps]);

  const handlePrint = () => window.print();
  const projectName = project?.project_name ?? "Project";

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Summary to view requirements.
      </div>
    );
  }

  if (err) {
    return (
      <div className="page-root" style={{ color: "red", fontSize: 14 }}>
        Error loading requirements: {err}
      </div>
    );
  }

  if (!steps) {
    return <div className="page-root">Loading requirements...</div>;
  }

  return (
    <div className="page-root requirements-page">
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
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            {projectName}
          </h1>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500 }}>
            Requirements
          </h2>
          <p style={subText}>
            Auto-populated from requirement checkboxes in Development Activities.
          </p>
        </div>
        <div className="print-hidden" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SaveAsPdfButton style={{ marginRight: 4 }} />
          <img
            src={logo}
            alt="Land Charge"
            style={{ height: 32, width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      <div
        className="requirements-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {REQUIREMENT_BUCKETS.map((bucket) => {
          const list = grouped[bucket] ?? [];
          return (
            <section key={bucket} className="requirements-card" style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                    {bucket}
                  </div>
                  <p style={subText}>
                    Activities with this requirement checked.
                  </p>
                </div>
                <span style={badge}>
                  {list.length} {list.length === 1 ? "Activity" : "Activities"}
                </span>
              </div>

              {list.length === 0 ? (
                <p style={{ ...subText, marginTop: 4 }}>
                  Nothing here yet. Check this requirement in Development Activities to populate.
                </p>
              ) : (
                <div style={tableContainer}>
                  <table style={{ minWidth: 480 }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: "nowrap" }}>Activity</th>
                        <th>Status</th>
                        <th style={{ whiteSpace: "nowrap" }}>Dev Type</th>
                        <th>Phase</th>
                        <th>Start</th>
                        <th>End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((step) => (
                        <tr key={step.id}>
                          <td style={{ fontWeight: 600 }}>{step.name}</td>
                          <td>{step.status ?? ""}</td>
                          <td>{step.development_type ?? ""}</td>
                          <td>{(step as any).phase ?? ""}</td>
                          <td>{(step as any).start_date ?? ""}</td>
                          <td>{(step as any).end_date ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
