import { useEffect, useMemo, useState } from "react";
import type { DevelopmentStep } from "../types";
import { fetchDevelopmentSteps } from "../lib/api";

function StatusDot({ status }: { status: "Complete" | "In Progress" | "In Queue" }) {
  const color =
    status === "Complete" ? "#22c55e" : status === "In Progress" ? "#eab308" : "#ef4444";
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

export default function MilestoneTable() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DevelopmentStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDevelopmentSteps();
        // Ensure a stable order. If your API supports ?ordering=, use that instead.
        const ordered = [...data.results].sort((a, b) => a.id - b.id);
        setRows(ordered);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Temporary derived fields so we can show a status and percent.
  // Later we’ll replace these with real DB columns (status, percent_complete, etc.).
  const computed = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        sequence: i + 1,
        percentComplete: i === 0 ? 100 : 0,
        status: i === 0 ? ("Complete" as const) : ("In Queue" as const),
        startDate: null as string | null,
      })),
    [rows]
  );

  if (loading) return <p style={{ padding: 24 }}>Loading milestones…</p>;
  if (error) return <p style={{ padding: 24, color: "crimson" }}>Error: {error}</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Project Milestones</h1>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#0f172a", color: "white" }}>
            <tr>
              <th style={th}>Health</th>
              <th style={th}>% Complete</th>
              <th style={th}>Task</th>        {/* <-- show the real task name */}
              <th style={th}>Status</th>
              <th style={th}>Start Date</th>
            </tr>
          </thead>

          <tbody>
            {computed.map((row) => (
              <tr key={row.id}>
                <td style={tdCenter}>
                  <StatusDot status={row.status} />
                </td>

                <td style={tdCenter}>
                  <div
                    style={{
                      width: 90,
                      height: 18,
                      background: "#fee2e2",
                      borderRadius: 4,
                      overflow: "hidden",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        width: `${row.percentComplete}%`,
                        height: "100%",
                        background:
                          row.percentComplete === 100 ? "#22c55e" : "#ef4444",
                      }}
                    />
                  </div>
                  <span style={{ marginLeft: 8, verticalAlign: "middle" }}>
                    {row.percentComplete}%
                  </span>
                </td>

                {/* The important change: render the original DB column */}
                <td style={tdLeft}>
                  {row.name}
                </td>

                <td style={td}>{row.status}</td>
                <td style={td}>{row.startDate ?? "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", borderTop: "1px solid #e5e7eb" };
const tdLeft: React.CSSProperties = { ...td, fontWeight: 500 };
const tdCenter: React.CSSProperties = { ...td, textAlign: "center" };
