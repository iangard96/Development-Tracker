// ui/src/DevTypeSpendChart.tsx
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import type { DevStep, DevType } from "./types";

const OVER_AMBER = "#b45309";
const UNDER_AMBER = "#f7c241";
const PLANNED_AMBER = "#b87914";
const ACTUAL_AMBER = "#f2b84b";

type SpendRow = {
  devTypeLabel: string;
  planned: number;
  actual: number;
  // planned - actual: >0 = under budget, <0 = over budget
  delta: number;
  deltaLabel: string;
};

const DEV_TYPES: { key: DevType; label: string }[] = [
  { key: "Due Diligence", label: "Due Diligence" },
  { key: "Interconnection", label: "Interconnection" },
  { key: "Permitting", label: "Permitting" },
];

type Props = {
  /** Full DevStep list with planned_spend / actual_spend / development_type */
  steps: DevStep[];
};

export default function DevTypeSpendChart({ steps }: Props) {
  const safeSteps = Array.isArray(steps) ? steps : [];

  // Aggregate spend by development type from the passed-in steps
  const rows = useMemo<SpendRow[]>(() => {
    return DEV_TYPES.map(({ key, label }) => {
      const group = safeSteps.filter(
        (s: DevStep) => (s as any).development_type === key
      );

      const planned = group.reduce(
        (sum, s: any) => sum + (s.planned_spend ?? 0),
        0
      );
      const actual = group.reduce(
        (sum, s: any) => sum + (s.actual_spend ?? 0),
        0
      );

      const diff = planned - actual; // >0 = under, <0 = over
      let delta = 0;
      let deltaLabel = "$0";

      if (planned !== 0 || actual !== 0) {
        if (Math.abs(diff) < 0.5) {
          delta = 0;
          deltaLabel = "$0";
        } else if (diff > 0) {
          delta = diff;
          deltaLabel = `under $${Math.abs(diff).toLocaleString()}`;
        } else {
          delta = diff; // negative
          deltaLabel = `over $${Math.abs(diff).toLocaleString()}`;
        }
      }

      return { devTypeLabel: label, planned, actual, delta, deltaLabel };
    });
  }, [safeSteps]);

  const maxAbsDelta =
    rows.reduce((m, r) => Math.max(m, Math.abs(r.delta)), 0) || 1000;
  // Symmetric domain: [-maxAbsDelta, maxAbsDelta] with 0 centered
  const deltaDomain = [-maxAbsDelta, maxAbsDelta];
  const deltaTicks = useMemo(() => {
    const max = maxAbsDelta;
    if (!Number.isFinite(max) || max === 0) return [0];
    const vals = [-max, 0, max];
    return Array.from(new Set(vals)).sort((a, b) => a - b);
  }, [maxAbsDelta]);

  const maxSpend =
    rows.reduce((m, r) => Math.max(m, r.planned, r.actual), 0) || 0;

  // Pad and snap the max to a "nice" value (nearest 1k) so ticks are readable
  const spendMaxWithPad = useMemo(() => {
    const padded = (maxSpend || 1) * 1.2;
    const nice = Math.ceil(padded / 1000) * 1000;
    return nice || 1000;
  }, [maxSpend]);

  // Ticks for the right-hand X-axis: generate ~5 nice ticks from 0 to max
  const spendTicks: number[] = useMemo(() => {
    const max = spendMaxWithPad || 1000;
    const rawStep = max / 5;
    // snap step to nearest 500/1000/5000 etc.
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10].map((m) => m * magnitude);
    const step =
      candidates.find((c) => c >= rawStep) ??
      candidates[candidates.length - 1] * 2;

    const ticks: number[] = [];
    for (let v = 0; v <= max + 1e-6; v += step) {
      ticks.push(Math.round(v));
    }
    ticks.push(max);
    ticks.push(0);

    return Array.from(new Set(ticks))
      .sort((a, b) => a - b)
      .map((t) => Number(t.toFixed(0)));
  }, [spendMaxWithPad]);

  /* ----- Custom label renderers ----- */

  const DeltaLabel = (props: any) => {
    const {
      x = 0,
      y = 0,
      width = 0,
      height = 0,
      value,
      index = 0,
    } = props;

    // Guard against NaN values
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return null;

    const label = (value ?? "") as string;
    const delta = rows[index]?.delta ?? 0;

    if (!label) return null;

    const barWidth = Math.abs(Number(width));
    const left = width < 0 ? x + width : x;
    const right = width >= 0 ? x + width : x;
    const centerX = left + barWidth / 2;
    const centerY = y + height / 2 + 4;
    
    if (isNaN(centerX) || isNaN(centerY)) return null;

    const isUnder = delta > 0;
    const outsideColor = isUnder ? UNDER_AMBER : OVER_AMBER;
    const MIN_INSIDE_WIDTH = 40;

    if (barWidth >= MIN_INSIDE_WIDTH) {
      return (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="var(--text)"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    }

    // Too small: place just outside, away from the axis
    if (isUnder) {
      const textX = right + 8;
      if (isNaN(textX)) return null;
      return (
        <text
          x={textX}
          y={centerY}
          textAnchor="start"
          fill={outsideColor}
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    } else {
      const textX = left - 8;
      if (isNaN(textX)) return null;
      return (
        <text
          x={textX}
          y={centerY}
          textAnchor="end"
          fill={outsideColor}
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    }
  };

  const SpendLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, value } = props;
    
    // Guard against null, undefined, or NaN values
    if (value == null || isNaN(value)) return null;
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === 0) return null;

    const barWidth = Number(width);
    if (isNaN(barWidth)) return null;
    
    const centerX = x + barWidth / 2;
    const centerY = y + height / 2 + 4;
    
    // Verify centerX and centerY are valid numbers
    if (isNaN(centerX) || isNaN(centerY)) return null;
    
    const label = `$${numValue.toLocaleString()}`;

    const MIN_INSIDE_WIDTH = 40;

    if (Math.abs(barWidth) >= MIN_INSIDE_WIDTH) {
      return (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="var(--text)"
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    }

    const textX = x + barWidth + 6;
    if (isNaN(textX)) return null;
    
    return (
      <text
        x={textX}
        y={centerY}
        textAnchor="start"
        fill="var(--text)"
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        {label}
      </text>
    );
  };

  return (
    <div
      style={{
        marginTop: 24,
        marginBottom: 32,
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--card)",
        boxShadow: "var(--shadow)",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Budget vs Actual by Development Type
      </h2>
      <p style={{ marginBottom: 12, color: "var(--muted)" }}>
        Left chart shows how far we are over or under budget (centered at $0).
        Right chart shows total planned vs actual spend.
      </p>

      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "stretch",
          width: "100%",
          height: 300,
        }}
      >
        {/* LEFT: delta chart */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid var(--border)",
            paddingRight: 12,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Over / Under Budget
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 40, bottom: 28 }}
            >
              <XAxis
                type="number"
                domain={deltaDomain}
                ticks={deltaTicks}
                tickFormatter={(v) =>
                  v === 0 ? "$0" : `$${Math.abs(Number(v)).toLocaleString()}`
                }
              />
              <YAxis
                type="category"
                dataKey="devTypeLabel"
                width={110}
                tick={{ fontSize: 14 }}
              />
              <Tooltip
                formatter={(value: any) => {
                  const v = Number(value);
                  if (Math.abs(v) < 0.5) return ["$0", "Delta"];
                  return v < 0
                    ? [`over $${Math.abs(v).toLocaleString()}`, "Delta"]
                    : [`under $${Math.abs(v).toLocaleString()}`, "Delta"];
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                content={() => <DeltaLegend />}
              />
              <ReferenceLine
                x={0}
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{
                  value: "$0",
                  position: "insideTop",
                  fill: "var(--muted)",
                  fontSize: 12,
                  offset: 10,
                }}
              />
              <Bar
                dataKey="delta"
                name="Delta ($)"
                legendType="none"
                barSize={24}
              >
                <LabelList dataKey="deltaLabel" content={DeltaLabel} />
                {rows.map((row, i) => (
                  <Cell
                    key={i}
                    fill={
                      row.delta > 0.5
                        ? UNDER_AMBER
                        : row.delta < -0.5
                        ? OVER_AMBER
                        : "var(--muted)" // ~on budget
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT: spend chart */}
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Planned vs Actual Spend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 40, bottom: 28 }}
            >
              {/* X axis: numeric, with 0 as the first tick along the bottom */}
              <XAxis
                type="number"
                domain={[0, spendMaxWithPad]}
                ticks={spendTicks}
                tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
              />
              {/* Y axis: categorical labels visible */}
              <YAxis
                type="category"
                dataKey="devTypeLabel"
                width={110}
                tick={{ fontSize: 14 }}
              />

              <Tooltip
                formatter={(value: any, name: any) => [
                  `$${Number(value).toLocaleString()}`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                content={(props) => <SpendLegend {...props} />}
              />

              {/* Planned: dark amber */}
              <Bar dataKey="planned" name="Planned Spend" fill={PLANNED_AMBER}>
                <LabelList dataKey="planned" content={SpendLabel} />
              </Bar>

              {/* Actual: bright amber */}
              <Bar dataKey="actual" name="Actual Spend" fill={ACTUAL_AMBER}>
                <LabelList dataKey="actual" content={SpendLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------- Custom legends ---------- */

// Over on the left, Under on the right
function DeltaLegend() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        fontSize: 12,
        marginTop: 4,
      }}
    >
      {/* Over first (muted red) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            display: "inline-block",
            backgroundColor: OVER_AMBER,
          }}
        />
        <span style={{ color: "var(--text)" }}>Over budget</span>
      </div>
      {/* Under second (muted green) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            display: "inline-block",
            backgroundColor: UNDER_AMBER,
          }}
        />
        <span style={{ color: "var(--text)" }}>Under budget</span>
      </div>
    </div>
  );
}

function SpendLegend(props: any) {
  const { payload } = props;
  if (!payload || !payload.length) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        fontSize: 12,
        marginTop: 4,
      }}
    >
      {payload.map((entry: any) => (
        <div
          key={entry.value}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              display: "inline-block",
              backgroundColor: entry.color,
            }}
          />
          {/* force label text to black */}
          <span style={{ color: "var(--text)" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
