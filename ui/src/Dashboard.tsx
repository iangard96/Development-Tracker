import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAllSteps } from "./api";

type Step = {
  id: number;
  name: string;
  phase?: string | number | null;
};

type ChartRow = { step: string; phaseNum: number };

function toPhaseNumber(phase: Step["phase"]): number {
  if (phase == null) return 0;
  if (typeof phase === "number") return phase;
  // try "Phase 3", "3", "phase 2", etc.
  const m = String(phase).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export default function Dashboard() {
  const [data, setData] = useState<ChartRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSteps()
      .then((rows: Step[]) => {
        const d = rows.map((r, i) => ({
          step: r.name || `#${i + 1}`,
          phaseNum: toPhaseNumber(r.phase),
        }));
        setData(d);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  if (!data.length) return <div>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Project Dashboard</h1>
      <p style={{ marginBottom: 12, color: "#4b5563" }}>
        Each bar corresponds to a development step; the bar height is that step’s <b>Phase</b> number.
      </p>

      <div style={{ width: "100%", height: 420, border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="step" hide />
            <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} label={{ value: "Phase", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Bar dataKey="phaseNum" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
