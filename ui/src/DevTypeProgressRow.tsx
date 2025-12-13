// ui/src/DevTypeProgressRow.tsx
import { useEffect, useMemo, useState } from "react";
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
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    // Always animate, even for 0%, by nudging to a tiny epsilon first.
    const target = clamped === 0 ? 0.0001 : clamped;
    setAnimPct(0);
    const id = window.requestAnimationFrame(() => setAnimPct(target));
    return () => window.cancelAnimationFrame(id);
  }, [clamped]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animPct / 100);
  const track = "#e5e7eb";
  const purple = "#C6B5FF";
  const progressColor = clamped === 0 ? track : purple;

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
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="translate(80 80)">
          {/* Track */}
          <circle
            r={radius}
            fill="none"
            stroke={track}
            strokeWidth={16}
            strokeDasharray={circumference}
            strokeDashoffset={0}
          />
          {/* Progress, start at top (-90 deg) */}
          <circle
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={16}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 0 0)"
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontSize="28"
            fontWeight="700"
            fill="#111827"
            transform="rotate(0)"
          >
            {clamped}%
          </text>
        </g>
      </svg>

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
