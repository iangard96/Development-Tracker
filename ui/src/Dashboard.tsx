// ui/src/Dashboard.tsx
import { useEffect, useState } from "react";
import { fetchAllSteps } from "./api";
import DevTypeProgressRow from "./DevTypeProgressRow";
import DevTypeSpendChart from "./DevTypeSpendChart";
import DevTypeGanttChart from "./DevTypeGanttChart";
import type { DevStep } from "./types";

export default function Dashboard() {
  const [steps, setSteps] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSteps()
      .then((rows: DevStep[]) => setSteps(rows))
      .catch((e) => setErr(String(e)));
  }, []);

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
      {/* 1. Top row: 3 circular gauges */}
      <DevTypeProgressRow />

      {/* 2. Gantt chart under the gauges */}
      <DevTypeGanttChart steps={steps} />

      {/* 3. Budget vs Actual spend under the Gantt */}
      <DevTypeSpendChart steps={steps} />
    </div>
  );
}
