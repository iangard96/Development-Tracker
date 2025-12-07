// ui/src/DevTypeProgressRow.tsx
import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import type { DevStep, DevType } from "./types";

const DEV_TYPES: { key: DevType; label: string }[] = [
  { key: "Due Diligence", label: "Due Diligence" },
  { key: "Interconnection", label: "Interconnection" },
  { key: "Permitting", label: "Permitting" },
];

type GaugeRow = {
  devTypeLabel: string;
  pct: number; // 0–100
};

export default function DevTypeProgressRow({ steps }: { steps: DevStep[] }) {
  const gauges = useMemo<GaugeRow[]>(() => {
    return DEV_TYPES.map(({ key, label }) => {
      const group = steps.filter((s) => s.development_type === key);

      if (!group.length) {
        return { devTypeLabel: label, pct: 0 };
      }

      const completed = group.filter(
        (s) => (s.status ?? "") === "Completed",
      ).length;

      const pct = Math.round((completed / group.length) * 100);
      return { devTypeLabel: label, pct };
    });
  }, [steps]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            alignItems: "center",
            gap: 24,
          }}
        >
          {gauges.map((g) => (
            <DonutGauge key={g.devTypeLabel} label={g.devTypeLabel} pct={g.pct} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DonutGauge({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));

  const data = [
    { name: "completed", value: clamped },
    { name: "remaining", value: 100 - clamped },
  ];

  const purple = "#C6B5FF"; // light purple
  const track = "#e5e7eb";

  return (
    <div
      style={{
        flex: "1 1 220px",
        maxWidth: 260,
        minWidth: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Chart + % overlay */}
      <div
        style={{
          position: "relative",
          width: 160,
          height: 160,
        }}
      >
        <PieChart width={160} height={160}>
          <Pie
            data={data}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={55}
            outerRadius={75}
            stroke="none"
          >
            <Cell key="completed" fill={purple} />
            <Cell key="remaining" fill={track} />
          </Pie>
        </PieChart>

        {/* Centered percentage text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
          }}
        >
          {clamped}%
        </div>
      </div>

      {/* Label beneath donut */}
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {label}
      </div>
    </div>
  );
}
