// ui/src/DevTypeProgressRow.tsx
import { useEffect, useMemo, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
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
            alignItems: "flex-start",
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
  const [chartValue, setChartValue] = useState(0);

  // For 0%, animate a full sweep (100) but still show 0% in the label
  const targetValue = clamped === 0 ? 100 : clamped;
  const barColor = clamped === 0 ? "#e5e7eb" : "#C6B5FF";

  useEffect(() => {
    let raf: number | null = null;
    const duration = 800; // ms
    const startTime = performance.now();
    setChartValue(0);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = targetValue * eased;
      setChartValue(next <= 0 ? 0.0001 : next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [targetValue]);

  const size = 140;

  return (
    <div
      style={{
        flex: "1 1 150px",
        maxWidth: 200,
        minWidth: 150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        position: "relative",
      }}
    >
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="88%"
            barSize={10}
            data={[{ name: label, value: chartValue }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              minAngle={2}
              background={{ fill: "#f1f5f9" }}
              clockWise
              dataKey="value"
              cornerRadius={999}
              fill={barColor}
              isAnimationActive={false} // animation is driven via state above
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1,
        }}
      >
        {clamped}%
      </div>
      <div
        style={{
          marginTop: size * 0.08,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {label}
      </div>
    </div>
  );
}
