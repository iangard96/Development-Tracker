// ui/src/DevTypeProgressRow.tsx
import { useEffect, useMemo, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import type { DevStep } from "./types";

const REQUIREMENTS: Array<{ label: string; flagKey: keyof DevStep }> = [
  { label: "Engineering", flagKey: "engineering_flag" },
  { label: "Permitting/Compliance", flagKey: "permitting_compliance_flag" },
  { label: "Financing", flagKey: "financing_flag" },
  { label: "Interconnection", flagKey: "interconnection_flag" },
  { label: "Site Control", flagKey: "site_control_flag" },
  { label: "Construction/Execution", flagKey: "construction_execution_flag" },
];

function isCheckedFlag(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const lower = String(value).trim().toLowerCase();
  return ["x", "yes", "y", "1", "true"].includes(lower);
}

function requirementSetForStep(step: DevStep): Set<string> {
  const raw = ((step as any).requirement ?? "") as string;
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  if (set.size === 0) {
    REQUIREMENTS.forEach((req) => {
      const val = (step as any)[req.flagKey];
      if (isCheckedFlag(val)) {
        set.add(req.label);
      }
    });
  }

  return set;
}

type GaugeRow = {
  requirementLabel: string;
  pct: number; // 0-100
};

export default function DevTypeProgressRow({ steps }: { steps: DevStep[] }) {
  const safeSteps = Array.isArray(steps) ? steps : [];

  const gauges = useMemo<GaugeRow[]>(() => {
    const requirementSets = new Map<number, Set<string>>();
    safeSteps.forEach((s) => {
      requirementSets.set(s.id, requirementSetForStep(s));
    });

    return REQUIREMENTS.map(({ label }) => {
      let total = 0;
      let completed = 0;

      safeSteps.forEach((step) => {
        const reqs = requirementSets.get(step.id);
        if (reqs?.has(label)) {
          total += 1;
          if ((step.status ?? "") === "Completed") {
            completed += 1;
          }
        }
      });

      if (total === 0) {
        return { requirementLabel: label, pct: 0 };
      }

      const pct = Math.round((completed / total) * 100);
      return { requirementLabel: label, pct };
    });
  }, [safeSteps]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          width: "100%",
          background: "var(--card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
            gap: 24,
            justifyItems: "center",
          }}
        >
          {gauges.map((g) => (
            <DonutGauge key={g.requirementLabel} label={g.requirementLabel} pct={g.pct} />
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
  const barColor = clamped === 0 ? "var(--border)" : "var(--accent-strong)";

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
              background={{ fill: "var(--surface)" }}
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
          color: "var(--text)",
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
          color: "var(--text)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
