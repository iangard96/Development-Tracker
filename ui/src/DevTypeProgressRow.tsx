// ui/src/DevTypeProgressRow.tsx
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DevStep, DevType } from "./types";

const DEV_TYPES: { key: DevType; label: string }[] = [
  { key: "Due Diligence", label: "Due Diligence" },
  { key: "Interconnection", label: "Interconnection" },
  { key: "Permitting", label: "Permitting" },
];

type GaugeRow = {
  devTypeLabel: string;
  pct: number; // 0-100
};

export default function DevTypeProgressRow({ steps }: { steps: DevStep[] }) {
  const safeSteps = Array.isArray(steps) ? steps : [];

  const gauges = useMemo<GaugeRow[]>(() => {
    return DEV_TYPES.map(({ key, label }) => {
      const group = safeSteps.filter((s) => s.development_type === key);

      if (!group.length) {
        return { devTypeLabel: label, pct: 0 };
      }

      const completed = group.filter(
        (s) => (s.status ?? "") === "Completed",
      ).length;

      const pct = Math.round((completed / group.length) * 100);
      return { devTypeLabel: label, pct };
    });
  }, [safeSteps]);

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
  const display = clamped === 0 ? 0.0001 : clamped; // epsilon so animation still runs at 0
  const data = [
    { name: "progress", value: display },
    { name: "rest", value: Math.max(0, 100 - display) },
  ];

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
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={55}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-in-out"
          >
            <Cell key="progress" fill={clamped === 0 ? "#e5e7eb" : "#C6B5FF"} stroke="none" />
            <Cell key="rest" fill="#e5e7eb" stroke="none" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          marginTop: -110,
          position: "relative",
          textAlign: "center",
          fontSize: 28,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {clamped}%
      </div>
      <div
        style={{
          marginTop: 12,
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
