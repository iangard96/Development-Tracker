// ui/src/Lease.tsx
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";
import { useProject } from "./ProjectContext";

export default function Lease() {
  const { projectId, project } = useProject();

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Portfolio to view lease information.
      </div>
    );
  }

  const leaseStart =
    (project as any)?.lease_option_start_date || "Not set (lease start)";
  const leaseEnd =
    (project as any)?.lease_option_expiration_date ||
    "Not set (lease expiration)";

  const projectName = project?.project_name ?? "Project";

  return (
    <div className="page-root">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 className="page-title">{projectName}</h1>
          <h2 className="page-subtitle">Lease</h2>
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 13 }}>
            Lease dates pulled from Project Portfolio.
          </p>
        </div>
        <div className="print-hidden" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SaveAsPdfButton style={{ marginRight: 4 }} />
          <img
            src={logo}
            alt="Land Charge"
            style={{ height: 60, width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <InfoCard label="Lease Option Start Date" value={leaseStart} />
        <InfoCard label="Lease Option Expiration Date" value={leaseEnd} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 14px",
        minHeight: 80,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{value}</div>
    </div>
  );
}
