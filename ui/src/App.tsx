// ui/src/App.tsx
import { useEffect, useMemo, useState } from "react";
import type { DevStep } from "./types";
import { fetchAllSteps, updateStepDates, updateStepStatus } from "./api";

/** Convert whatever we have to what <input type="date"> expects (YYYY-MM-DD). */
function normalizeForDateInput(value?: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; // already ISO
  const d = new Date(value);
  if (isNaN(+d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Small reusable date cell that PATCHes one field and returns the fresh row. */
function DateCell({
  id,
  field,
  value,
  onSaved,
}: {
  id: number;
  field: "start_date" | "end_date";
  value: string | null | undefined;
  onSaved: (fresh: DevStep) => void;
}) {
  async function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    const iso = e.currentTarget.value || null; // "YYYY-MM-DD" or null
    try {
      const fresh = await updateStepDates(id, { [field]: iso });
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update date.\n${err?.message ?? ""}`);
    }
  }

  return (
    <input
      type="date"
      defaultValue={normalizeForDateInput(value)}
      onBlur={onBlur}
      style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 8 }}
    />
  );
}

/** Status dropdown cell */
const STATUS_OPTIONS = ["", "Not Started", "In Progress", "Completed"] as const;
type StepStatus = (typeof STATUS_OPTIONS)[number];

function StatusCell({
  step,
  onSaved,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
}) {
  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as StepStatus;
    try {
      const fresh = await updateStepStatus(step.id, next);
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status.\n${err?.message ?? ""}`);
    }
  }

  return (
    <select
      value={(step.status as StepStatus) ?? ""}
      onChange={onChange}
      style={{
        padding: "4px 8px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "white",
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt === "" ? "—" : opt}
        </option>
      ))}
    </select>
  );
}

export default function App() {
  const [rows, setRows] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSteps().then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id);
  }, [rows]);

  if (err) return <div style={{ color: "red", padding: 16 }}>Error: {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Development Steps</h1>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Tasks</th>
              <th style={th}>Phase</th>
              <th style={th}>Start Date</th>
              <th style={th}>End Date</th>
              <th style={th}>Duration (Days)</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={td}>{r.sequence ?? i + 1}</td>
                <td style={td}>{r.name}</td>
                <td style={td}>{(r as any).phase ?? ""}</td>

                {/* Start Date */}
                <td style={td}>
                  <DateCell
                    id={r.id}
                    field="start_date"
                    value={(r as any).start_date}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                      )
                    }
                  />
                </td>

                {/* End Date */}
                <td style={td}>
                  <DateCell
                    id={r.id}
                    field="end_date"
                    value={(r as any).end_date}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                      )
                    }
                  />
                </td>

                <td style={td}>{(r as any).duration_days ?? ""}</td>

                {/* Status dropdown */}
                <td style={td}>
                  <StatusCell
                    step={r}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 12px", verticalAlign: "middle" };
