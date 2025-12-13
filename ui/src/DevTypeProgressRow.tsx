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
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const size = 110;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - animatedPct / 100);

  return (
    <div
      style={{
        flex: "1 1 150px",
        maxWidth: 190,
        minWidth: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        position: "relative",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ display: "block", marginTop: -2 }}
        viewBox={`0 0 ${size} ${size}`}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#C6B5FF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 900ms ease-in-out",
            }}
          />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "55%",
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
