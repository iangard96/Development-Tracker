// ui/src/App.tsx
import { useEffect, useMemo, useState } from "react";
import type { DevStep, DevType } from "./types";
import {
  fetchAllSteps,
  updateStepDates,
  updateStepStatus,
  updateStepDevType,
  updateStepSpend,
} from "./api";

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

/** Dev Type dropdown cell */
const DEV_TYPE_OPTIONS: DevType[] = ["", "Interconnection", "Permitting", "Due Diligence"];

function DevTypeCell({
  step,
  onSaved,
}: {
  step: DevStep;
  onSaved: (fresh: DevStep) => void;
}) {
  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = (e.target.value || "") as DevType | "";
    try {
      const fresh = await updateStepDevType(step.id, next);
      onSaved(fresh);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update development type.\n${err?.message ?? ""}`);
    }
  }

  return (
    <select
      value={step.development_type ?? ""}
      onChange={onChange}
      style={{
        padding: "4px 8px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "white",
      }}
    >
      {DEV_TYPE_OPTIONS.map((opt) => (
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
  const [devTypeFilter, setDevTypeFilter] = useState<DevType | "ALL">("ALL");

  useEffect(() => {
    fetchAllSteps().then(setRows).catch((e) => setErr(String(e)));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const base = [...rows].sort(
      (a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.id - b.id
    );
    if (devTypeFilter === "ALL") return base;
    return base.filter((r) => (r.development_type ?? "") === devTypeFilter);
  }, [rows, devTypeFilter]);

  if (err) return <div style={{ color: "red", padding: 16 }}>Error: {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div className="page-root">
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
        Development Steps
      </h1>

      {/* Dev Type filter */}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <label>
          <span style={{ marginRight: 8 }}>Development Type:</span>
          <select
            value={devTypeFilter}
            onChange={(e) => setDevTypeFilter(e.target.value as DevType | "ALL")}
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="ALL">All</option>
            {DEV_TYPE_OPTIONS.filter((x) => x !== "").map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}
      >
        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Tasks</th>
              <th style={th}>Phase</th>
              <th style={th}>Dev Type</th>
              <th style={th}>Planned Spend</th>
              <th style={th}>Actual Spend</th>
              <th style={th}>Start Date</th>
              <th style={th}>End Date</th>
              <th style={th}>Duration (Days)</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={td}>{(r as any).sequence ?? i + 1}</td>
                <td style={td}>{r.name}</td>
                <td style={td}>{(r as any).phase ?? ""}</td>

                {/* Dev Type */}
                <td style={td}>
                  <DevTypeCell
                    step={r}
                    onSaved={(fresh) =>
                      setRows((cur) =>
                        cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                      )
                    }
                  />
                </td>

                {/* Planned Spend */}
                <td style={td}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={r.planned_spend ?? ""}
                    onChange={async (e) => {
                      const raw = e.target.value;

                      // allow clearing
                      if (raw === "") {
                        try {
                          const fresh = await updateStepSpend(r.id, { planned_spend: null });
                          setRows((cur) =>
                            cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                          );
                        } catch (err: any) {
                          console.error(err);
                          alert(
                            `Failed to update planned spend.\n${err?.message ?? ""}`
                          );
                        }
                        return;
                      }

                      const num = Number(raw);
                      const v = Math.round(num * 100) / 100; // 2 decimal places

                      try {
                        const fresh = await updateStepSpend(r.id, { planned_spend: v });
                        setRows((cur) =>
                          cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                        );
                      } catch (err: any) {
                        console.error(err);
                        alert(
                          `Failed to update planned spend.\n${err?.message ?? ""}`
                        );
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </td>

                {/* Actual Spend */}
                <td style={td}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={r.actual_spend ?? ""}
                    onChange={async (e) => {
                      const raw = e.target.value;

                      // allow clearing
                      if (raw === "") {
                        try {
                          const fresh = await updateStepSpend(r.id, { actual_spend: null });
                          setRows((cur) =>
                            cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                          );
                        } catch (err: any) {
                          console.error(err);
                          alert(
                            `Failed to update actual spend.\n${err?.message ?? ""}`
                          );
                        }
                        return;
                      }

                      const num = Number(raw);
                      const v = Math.round(num * 100) / 100; // 2 decimal places

                      try {
                        const fresh = await updateStepSpend(r.id, { actual_spend: v });
                        setRows((cur) =>
                          cur ? cur.map((x) => (x.id === r.id ? { ...x, ...fresh } : x)) : cur
                        );
                      } catch (err: any) {
                        console.error(err);
                        alert(
                          `Failed to update actual spend.\n${err?.message ?? ""}`
                        );
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </td>

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

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
};
const td: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "middle",
};
