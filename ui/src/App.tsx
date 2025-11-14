import { useEffect, useMemo, useRef, useState } from "react";
import type { DevStep } from "./types";
import { fetchAllSteps, updateStepStatus } from "./api";
import { updateStepDates } from "./api";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Complete"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

function fmtDate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleDateString();
}
function toInputDate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(+d)) return "";
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function App() {
  const [rows, setRows] = useState<DevStep[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);       // id being saved (status)
  const [editingId, setEditingId] = useState<number | null>(null); // status edit id
  const [dateEdit, setDateEdit] = useState<{ id: number; field: "start_date" | "end_date" } | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAllSteps().then(setRows).catch(e => setErr(String(e)));
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const sa = a.sequence ?? 0;
      const sb = b.sequence ?? 0;
      return sa - sb || a.id - b.id;
    });
  }, [rows]);

  // focus status select when entering edit mode
  useEffect(() => {
    if (editingId && selectRef.current) selectRef.current.focus();
  }, [editingId]);

  // focus date input when entering edit mode
  useEffect(() => {
    if (dateEdit && dateRef.current) dateRef.current.focus();
  }, [dateEdit]);

  async function commitStatus(stepId: number, newStatus: Status) {
    if (!rows) return;
    const prev = rows;
    const updated = rows.map(r => (r.id === stepId ? { ...r, status: newStatus } : r));
    setRows(updated);
    setSaving(stepId);
    try {
      await updateStepStatus(stepId, newStatus);
    } catch (e) {
      console.error(e);
      setRows(prev);
      alert("Failed to update status.");
    } finally {
      setSaving(null);
      setEditingId(null);
    }
  }

  async function commitDate(stepId: number, field: "start_date" | "end_date", value: string) {
    if (!rows) return;
    const prev = rows;

    // optimistic UI: set changed date, keep duration until server responds
    const updated = rows.map(r => (r.id === stepId ? { ...r, [field]: value } as DevStep : r));
    setRows(updated);

    try {
      const payload = field === "start_date" ? { start_date: value || null } : { end_date: value || null };
      const fresh = await updateStepDates(stepId, payload);
      // merge server truth (duration_days recomputed)
      setRows(cur => cur?.map(r => (r.id === stepId ? { ...r, ...fresh } : r)) ?? null);
    } catch (e) {
      console.error(e);
      setRows(prev);
      alert("Failed to update date.");
    } finally {
      setDateEdit(null);
    }
  }

  function cancelStatusEdit() { setEditingId(null); }
  function cancelDateEdit()   { setDateEdit(null);   }

  if (err) return <div style={{ color: "red", padding: 16 }}>Error: {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Development Steps
      </h1>

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
            {sorted.map((r, i) => {
              const isStatusEditing = editingId === r.id;
              const currentStatus = ((r.status as Status) ?? "Not Started") as Status;
              const isEditingStart = !!dateEdit && dateEdit.id === r.id && dateEdit.field === "start_date";
              const isEditingEnd   = !!dateEdit && dateEdit.id === r.id && dateEdit.field === "end_date";

              return (
                <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={td}>{r.sequence ?? i + 1}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{(r as any).phase ?? "Unassigned"}</td>

                  {/* Start Date */}
                  <td
                    style={{ ...td, cursor: "default" }}
                    onDoubleClick={() => setDateEdit({ id: r.id, field: "start_date" })}
                  >
                    {!isEditingStart ? (
                      fmtDate((r as any).start_date)
                    ) : (
                      <input
                        ref={dateRef}
                        type="date"
                        defaultValue={toInputDate((r as any).start_date)}
                        onBlur={(e) => commitDate(r.id, "start_date", e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitDate(r.id, "start_date", (e.target as HTMLInputElement).value);
                          if (e.key === "Escape") { e.preventDefault(); cancelDateEdit(); }
                        }}
                        style={dateInputStyle}
                      />
                    )}
                  </td>

                  {/* End Date */}
                  <td
                    style={{ ...td, cursor: "default" }}
                    onDoubleClick={() => setDateEdit({ id: r.id, field: "end_date" })}
                  >
                    {!isEditingEnd ? (
                      fmtDate((r as any).end_date)
                    ) : (
                      <input
                        ref={dateRef}
                        type="date"
                        defaultValue={toInputDate((r as any).end_date)}
                        onBlur={(e) => commitDate(r.id, "end_date", e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitDate(r.id, "end_date", (e.target as HTMLInputElement).value);
                          if (e.key === "Escape") { e.preventDefault(); cancelDateEdit(); }
                        }}
                        style={dateInputStyle}
                      />
                    )}
                  </td>

                  <td style={td}>{(r as any).duration_days ?? ""}</td>

                  {/* Status cell (double-click → dropdown) */}
                  <td
                    style={{ ...td, position: "relative", cursor: "default" }}
                    onDoubleClick={() => {
                      if (saving === r.id) return;
                      setEditingId(r.id);
                    }}
                  >
                    {!isStatusEditing ? (
                      <span
                        title="Double-click to edit"
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: currentStatus === "In Progress" ? "#eef2ff" : "#f3f4f6",
                          border: "1px solid #e5e7eb",
                          userSelect: "none",
                        }}
                      >
                        {currentStatus}
                      </span>
                    ) : (
                      <select
                        ref={selectRef}
                        defaultValue={currentStatus}
                        onChange={(e) => commitStatus(r.id, e.target.value as Status)}
                        onBlur={(e) => commitStatus(r.id, (e.target.value as Status) || currentStatus)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLSelectElement).value as Status;
                            commitStatus(r.id, value || currentStatus);
                          }
                          if (e.key === "Escape") { e.preventDefault(); cancelStatusEdit(); }
                        }}
                        disabled={saving === r.id}
                        style={selectStyle}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
            {!sorted.length && (
              <tr><td style={td} colSpan={7}>No steps.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 12px", verticalAlign: "middle" };
const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const dateInputStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  outline: "none",
};