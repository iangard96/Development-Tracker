// ui/src/DevTypeGanttChart.tsx
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Cell,
} from "recharts";
import type { DevStep, DevType } from "./types";

type GanttRow = {
  id: number;
  label: string;
  devType: DevType;
  startOffset: number; // days from global min date
  duration: number; // days
};

const DEV_TYPE_ORDER: DevType[] = [
  "Interconnection",
  "Due Diligence",
  "Permitting",
];

// Colors per dev type
const DEV_TYPE_COLORS: Record<string, string> = {
  Interconnection: "#0f766e",
  "Due Diligence": "#1d4ed8",
  Permitting: "#4C1D95",
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toDayNumber(value: any): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(+d)) return null;
  return Math.floor(d.getTime() / ONE_DAY_MS);
}

type Props = {
  steps: DevStep[];
};

export default function DevTypeGanttChart({ steps }: Props) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const [expanded, setExpanded] = useState(false);

  const { rows, minDay, maxDay } = useMemo(() => {
    const sorted = [...safeSteps].sort(
      (a: any, b: any) =>
        (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id,
    );

    type Parsed = {
      step: DevStep;
      devType: DevType;
      startDay: number;
      endDay: number;
    };

    const parsed: Parsed[] = [];

    for (const s of sorted) {
      const devType = (s as any).development_type as DevType | undefined;
      if (!devType || !DEV_TYPE_ORDER.includes(devType)) continue;

      const startDay = toDayNumber((s as any).start_date);
      const endDay = toDayNumber((s as any).end_date);
      if (startDay == null || endDay == null) continue;
      // Skip obviously bad ranges
      if (Number.isNaN(startDay) || Number.isNaN(endDay)) continue;
      if (endDay < startDay) continue;

      parsed.push({ step: s, devType, startDay, endDay });
    }

    if (!parsed.length) {
      return { rows: [] as GanttRow[], minDay: 0, maxDay: 0 };
    }

    const minDay = parsed.reduce(
      (m, p) => Math.min(m, p.startDay),
      parsed[0].startDay,
    );
    const maxDay = parsed.reduce(
      (m, p) => Math.max(m, p.endDay),
      parsed[0].endDay,
    );

    const rows: GanttRow[] = [];

    DEV_TYPE_ORDER.forEach((dt) => {
      parsed
        .filter((p) => p.devType === dt)
        .forEach((p) => {
          const duration = Math.max(1, p.endDay - p.startDay || 1);
          rows.push({
            id: p.step.id,
            label: `${dt}: ${p.step.name}`,
            devType: dt,
            startOffset: p.startDay - minDay,
            duration,
          });
        });
    });

    return { rows, minDay, maxDay };
  }, [safeSteps]);

  if (!rows.length) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        No tasks with both start and end dates to display on the Gantt chart.
      </div>
    );
  }

  const visibleRows = expanded ? rows : rows.slice(0, 3);
  const totalSpan = Math.max(1, maxDay - minDay + 1);
  const rowHeight = expanded ? 34 : 26;
  const basePadding = expanded ? 120 : 80;
  const minHeight = expanded ? 360 : 260;
  const chartHeight = Math.max(visibleRows.length * rowHeight + basePadding, minHeight);
  const legendItems = useMemo(
    () =>
      DEV_TYPE_ORDER.filter((dt) =>
        visibleRows.some((r) => r.devType === dt),
      ).map((dt) => ({
        type: "square",
        color: DEV_TYPE_COLORS[dt] ?? "#6b7280",
        value: dt,
      })),
    [visibleRows],
  );

  const formatTick = (offset: any) => {
    const n = Number(offset);
    const d = new Date((minDay + n) * ONE_DAY_MS);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const tooltipFormatter = (value: any, _name: any, props: any) => {
    const row = visibleRows.find((r) => r.label === props.payload.label);
    if (!row) return value;

    const start = new Date((minDay + row.startOffset) * ONE_DAY_MS);
    const end = new Date(
      (minDay + row.startOffset + row.duration) * ONE_DAY_MS,
    );
    const fmt = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    return [`${fmt(start)} - ${fmt(end)}`, "Duration"];
  };

  return (
    <div
      style={{
        marginTop: 16,
        marginBottom: 32,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Development Timeline by Type
          </h2>
          <p style={{ marginBottom: 12, color: "#4b5563", fontSize: 14 }}>
            Tasks are grouped by development type and ordered by the overall
            step sequence. Bars span from each task's start date to end date.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            minWidth: 90,
            marginTop: 2,
          }}
          title={expanded ? "Minimize chart" : "Maximize chart"}
        >
          {expanded ? "Minimize" : "Maximize"}
        </button>
      </div>
      {!expanded && rows.length > visibleRows.length && (
        <div style={{ marginBottom: 10, color: "#6b7280", fontSize: 13 }}>
          Showing {visibleRows.length} of {rows.length} activities. Maximize to
          see everything.
        </div>
      )}

      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleRows}
            layout="vertical"
            margin={{ top: 10, right: 24, left: 120, bottom: 24 }}
          >
            <XAxis
              type="number"
              domain={[0, totalSpan]}
              tickFormatter={formatTick}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={180}
              tick={{ fontSize: 12 }}
            />
            <Bar
              dataKey="startOffset"
              stackId="gantt"
              fill="rgba(0,0,0,0)"
              isAnimationActive={false}
            />
            <Bar dataKey="duration" stackId="gantt" isAnimationActive={false}>
              <LabelList
                dataKey="label"
                position="insideLeft"
                style={{
                  fill: "#ffffff",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                formatter={(v: string) => v.split(": ")[1] ?? v}
              />
              {visibleRows.map((row, i) => (
                <Cell
                  key={row.id ?? i}
                  fill={DEV_TYPE_COLORS[row.devType] ?? "#6b7280"}
                  radius={[4, 4, 4, 4]}
                />
              ))}
            </Bar>

            <Tooltip formatter={tooltipFormatter} labelFormatter={() => ""} />
            <Legend
              verticalAlign="bottom"
              align="center"
              content={() =>
                legendItems.length ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 12,
                      paddingTop: 8,
                    }}
                  >
                    {legendItems.map((item) => (
                      <span
                        key={item.value}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            background: item.color,
                            borderRadius: 2,
                            display: "inline-block",
                          }}
                        />
                        <span>{item.value}</span>
                      </span>
                    ))}
                  </div>
                ) : null
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
