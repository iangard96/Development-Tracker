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
} from "recharts";
import type { DevStep, DevType } from "./types";

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
  // Aggregate spend by development type from the passed-in steps
  const rows = useMemo<SpendRow[]>(() => {
    return DEV_TYPES.map(({ key, label }) => {
      const group = steps.filter(
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
      let deltaLabel = "On budget";

      if (planned !== 0 || actual !== 0) {
        if (Math.abs(diff) < 0.5) {
          delta = 0;
          deltaLabel = "On budget";
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
  }, [steps]);

  const maxAbsDelta =
    rows.reduce((m, r) => Math.max(m, Math.abs(r.delta)), 0) || 1;

  const maxSpend =
    rows.reduce((m, r) => Math.max(m, r.planned, r.actual), 0) || 0;

  const spendMaxWithPad = maxSpend * 1.1 || 1;

  // Ticks for the right-hand X-axis: start explicitly at 0
  const spendTicks: number[] = [];
  const rawStep = spendMaxWithPad / 4 || 1;
  const step =
    rawStep <= 100 ? Math.ceil(rawStep / 10) * 10 : Math.ceil(rawStep / 100) * 100;

  for (let v = 0; v <= spendMaxWithPad + 1e-6; v += step) {
    spendTicks.push(v);
  }
  if (!spendTicks.includes(0)) spendTicks.unshift(0);

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

    const label = (value ?? "") as string;
    const delta = rows[index]?.delta ?? 0;

    if (!label || delta === 0) return null;

    const barWidth = Math.abs(Number(width));
    const left = width < 0 ? x + width : x;
    const right = width >= 0 ? x + width : x;
    const centerX = left + barWidth / 2;
    const centerY = y + height / 2 + 4;

    const isUnder = delta > 0;
    const outsideColor = isUnder ? "#15803D" : "#DC2626"; // muted green / red
    const MIN_INSIDE_WIDTH = 60;

    if (barWidth >= MIN_INSIDE_WIDTH) {
      return (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="#ffffff"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    }

    // Too small: place just outside, away from the axis
    if (isUnder) {
      const textX = right + 8;
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
    if (value == null) return null;

    const barWidth = Number(width);
    const centerX = x + barWidth / 2;
    const centerY = y + height / 2 + 4;
    const label = `$${Number(value).toLocaleString()}`;

    const MIN_INSIDE_WIDTH = 60;

    if (Math.abs(barWidth) >= MIN_INSIDE_WIDTH) {
      return (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="#ffffff"
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {label}
        </text>
      );
    }

    const textX = x + barWidth + 6;
    return (
      <text
        x={textX}
        y={centerY}
        textAnchor="start"
        fill="#111827"
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
        border: "1px solid #e5e7eb",
        borderRadius: 12,
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Budget vs Actual by Development Type
      </h2>
      <p style={{ marginBottom: 12, color: "#4b5563" }}>
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
            borderRight: "1px solid #e5e7eb",
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
                domain={[-maxAbsDelta, maxAbsDelta]}
                tickFormatter={(v) =>
                  `$${Math.abs(Number(v)).toLocaleString()}`
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
                      row.delta < -0.5
                        ? "#DC2626" // muted red – over budget
                        : row.delta > 0.5
                        ? "#15803D" // muted green – under budget
                        : "#9ca3af" // ~on budget
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

              {/* Y axis: categorical but HIDDEN, so no vertical $0 labels */}
              <YAxis
                type="category"
                dataKey="devTypeLabel"
                axisLine={false}
                width={0}
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

              {/* Planned: dark, muted purple */}
              <Bar dataKey="planned" name="Planned Spend" fill="#4C1D95">
                <LabelList dataKey="planned" content={SpendLabel} />
              </Bar>

              {/* Actual: light purple */}
              <Bar dataKey="actual" name="Actual Spend" fill="#C6B5FF">
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
            backgroundColor: "#DC2626",
          }}
        />
        <span style={{ color: "#111827" }}>Over budget</span>
      </div>
      {/* Under second (muted green) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            display: "inline-block",
            backgroundColor: "#15803D",
          }}
        />
        <span style={{ color: "#111827" }}>Under budget</span>
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
          <span style={{ color: "#111827" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
