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
        ✓ Select a project from the Project Summary to view its dashboard.
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
    return <div className="page-root">Loading…</div>;
  }

  return (
    <div className="page-root">
      {project && (
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 32px" }}>
          {project.project_name}
        </h1>
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
