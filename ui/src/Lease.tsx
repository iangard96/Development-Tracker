// ui/src/Lease.tsx
import React, { useMemo, useState } from "react";
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";
import { useProject } from "./ProjectContext";

type LeaseDetails = {
  ownerName: string;
  optionTermYears: number | null;
  constructionTermYears: number | null;
  escalatorPct: number;
  apn: string;
  legalDescription: string;
  counterparty: string;
  leaseStart: string;
  leaseEnd: string;
  baseRent: number;
  frequency: "Annual" | "Monthly";
  termYears: number;
  leasedAreaImage?: string;
  leasedAreaImageName?: string;
};

type EconomicsBlock = {
  itcEligiblePct: number | null;
  recPrice: number | null;
  recTenorYears: number | null;
  ppaPrice: number | null;
  ppaEscPct: number | null;
  ppaTermYears: number | null;
  pvsystYieldMWh: number | null;
  pvsystDegradationPct: number | null;
  capexPerKw: number | null;
  opexPerKwYr: number | null;
};

type PaymentRow = {
  period: number;
  year: number;
  amount: number;
};

export default function Lease() {
  const { projectId, project } = useProject();

  const [lease, setLease] = useState<LeaseDetails>({
    ownerName: "",
    optionTermYears: null,
    constructionTermYears: null,
    escalatorPct: 2,
    apn: "",
    legalDescription: "",
    counterparty: "",
    leaseStart: "",
    leaseEnd: "",
    baseRent: 0,
    frequency: "Annual",
    termYears: 25,
    leasedAreaImage: undefined,
    leasedAreaImageName: undefined,
  });

  const [econ, setEcon] = useState<EconomicsBlock>({
    itcEligiblePct: 30,
    recPrice: null,
    recTenorYears: null,
    ppaPrice: null,
    ppaEscPct: null,
    ppaTermYears: null,
    pvsystYieldMWh: null,
    pvsystDegradationPct: 0.5,
    capexPerKw: null,
    opexPerKwYr: null,
  });

  const payments = useMemo<PaymentRow[]>(() => {
    const list: PaymentRow[] = [];
    const years = Math.max(1, Math.round(lease.termYears || 25));
    const freq = lease.frequency === "Monthly" ? 12 : 1;
    const esc = (lease.escalatorPct ?? 0) / 100;
    let current = lease.baseRent || 0;
    for (let y = 1; y <= years; y++) {
      for (let p = 1; p <= freq; p++) {
        const period = (y - 1) * freq + p;
        list.push({ period, year: y, amount: current / freq });
      }
      current = current * (1 + esc);
    }
    return list;
  }, [lease.baseRent, lease.escalatorPct, lease.frequency, lease.termYears]);

  const totalPayments = payments.reduce((sum, r) => sum + r.amount, 0);

  const annualRevenue = useMemo(() => {
    const prod = econ.pvsystYieldMWh ?? 0;
    const ppa = econ.ppaPrice ?? 0;
    const rec = econ.recPrice ?? 0;
    return prod * (ppa + rec);
  }, [econ.pvsystYieldMWh, econ.ppaPrice, econ.recPrice]);

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Portfolio to view economics.
      </div>
    );
  }

  const projectName = project?.project_name ?? "Project";

  return (
    <div className="page-root">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h1 className="page-title">{projectName}</h1>
          <h2 className="page-subtitle">Economics</h2>
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 13 }}>
            Lease, payments, incentives, production, and a lightweight financial snapshot.
          </p>
        </div>
        <div className="print-hidden" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <SaveAsPdfButton style={{ marginRight: 4 }} />
          <button
            type="button"
            onClick={() => alert("Lease generation stub. Wire to backend merge endpoint.")}
            style={ghostButton}
          >
            Generate Lease
          </button>
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
          gridTemplateColumns: "1.1fr 1fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Lease Details">
            <div style={formGridCols2}>
              <LabeledInput
                label="Owner Name"
                value={lease.ownerName}
                onChange={(v) => setLease({ ...lease, ownerName: v })}
              />
              <LabeledInput
                label="Counterparty"
                value={lease.counterparty}
                onChange={(v) => setLease({ ...lease, counterparty: v })}
              />
              <LabeledInput
                label="Option Term (yrs)"
                type="number"
                value={lease.optionTermYears ?? ""}
                onChange={(v) => setLease({ ...lease, optionTermYears: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="Construction Term (yrs)"
                type="number"
                value={lease.constructionTermYears ?? ""}
                onChange={(v) => setLease({ ...lease, constructionTermYears: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="Lease Start"
                type="date"
                value={lease.leaseStart}
                onChange={(v) => setLease({ ...lease, leaseStart: v })}
              />
              <LabeledInput
                label="Lease End"
                type="date"
                value={lease.leaseEnd}
                onChange={(v) => setLease({ ...lease, leaseEnd: v })}
              />
              <LabeledInput
                label="APN"
                value={lease.apn}
                onChange={(v) => setLease({ ...lease, apn: v })}
              />
              <LabeledInput
                label="Legal Description"
                value={lease.legalDescription}
                onChange={(v) => setLease({ ...lease, legalDescription: v })}
              />
              <LabeledInput
                label="Base Rent ($/yr)"
                type="number"
                value={lease.baseRent || ""}
                onChange={(v) => setLease({ ...lease, baseRent: v === "" ? 0 : Number(v) })}
              />
              <LabeledInput
                label="Escalator (%)"
                type="number"
                value={lease.escalatorPct}
                onChange={(v) => setLease({ ...lease, escalatorPct: v === "" ? 0 : Number(v) })}
              />
              <LabeledSelect
                label="Frequency"
                value={lease.frequency}
                onChange={(v) => setLease({ ...lease, frequency: v as LeaseDetails["frequency"] })}
                options={["Annual", "Monthly"]}
              />
              <LabeledInput
                label="Lease Term (yrs)"
                type="number"
                value={lease.termYears}
                onChange={(v) => setLease({ ...lease, termYears: v === "" ? 1 : Number(v) })}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Leased Area (JPEG/PNG)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setLease({ ...lease, leasedAreaImage: url, leasedAreaImageName: file.name });
                }}
              />
              {lease.leasedAreaImage && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{lease.leasedAreaImageName}</div>
                  <img
                    src={lease.leasedAreaImage}
                    alt="Leased area"
                    style={{ marginTop: 6, maxWidth: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </div>
              )}
            </div>
          </Card>

          <Card title="Schedule of Payments" action={
            <button
              type="button"
              onClick={() => {
                const csv = ["Period,Year,Amount"];
                payments.forEach((p) => csv.push([p.period, p.year, p.amount.toFixed(2)].join(",")));
                const blob = new Blob([csv.join("\n")], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "payment-schedule.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={ghostButton}
            >
              Export CSV
            </button>
          }>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
              Base rent escalated {lease.escalatorPct}%/{lease.frequency.toLowerCase()} over {lease.termYears} years.
              Total ≈ ${totalPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}.
            </div>
            <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={th}>Period</th>
                    <th style={th}>Year</th>
                    <th style={th}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 240).map((p) => (
                    <tr key={p.period} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={td}>{p.period}</td>
                      <td style={td}>{p.year}</td>
                      <td style={td}>${p.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                  {payments.length > 240 && (
                    <tr>
                      <td style={td} colSpan={3}>
                        … ({payments.length - 240} more periods)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Lease Template">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input type="file" accept=".doc,.docx,.odt,.pdf" />
              <button
                type="button"
                onClick={() => alert("Wire this to backend lease merge/template storage.")}
                style={ghostButton}
              >
                Upload template
              </button>
              <button
                type="button"
                onClick={() => alert("Stub download of current template.")}
                style={ghostButton}
              >
                Download template
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Use merge fields like <code>{"{owner_name}"}</code>, <code>{"{apn}"}</code>, <code>{"{base_rent}"}</code>, <code>{"{escalator_pct}"}</code> to auto-fill.
            </p>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="ITC Economics">
            <div style={formGridCols2}>
              <LabeledInput
                label="ITC Eligible (%)"
                type="number"
                value={econ.itcEligiblePct ?? ""}
                onChange={(v) => setEcon({ ...econ, itcEligiblePct: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="CapEx ($/kW)"
                type="number"
                value={econ.capexPerKw ?? ""}
                onChange={(v) => setEcon({ ...econ, capexPerKw: v === "" ? null : Number(v) })}
              />
            </div>
          </Card>

          <Card title="REC Economics">
            <div style={formGridCols2}>
              <LabeledInput
                label="REC Price ($/MWh)"
                type="number"
                value={econ.recPrice ?? ""}
                onChange={(v) => setEcon({ ...econ, recPrice: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="REC Tenor (yrs)"
                type="number"
                value={econ.recTenorYears ?? ""}
                onChange={(v) => setEcon({ ...econ, recTenorYears: v === "" ? null : Number(v) })}
              />
            </div>
          </Card>

          <Card title="PPA Economics">
            <div style={formGridCols2}>
              <LabeledInput
                label="PPA Price ($/MWh)"
                type="number"
                value={econ.ppaPrice ?? ""}
                onChange={(v) => setEcon({ ...econ, ppaPrice: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="PPA Escalator (%)"
                type="number"
                value={econ.ppaEscPct ?? ""}
                onChange={(v) => setEcon({ ...econ, ppaEscPct: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="PPA Term (yrs)"
                type="number"
                value={econ.ppaTermYears ?? ""}
                onChange={(v) => setEcon({ ...econ, ppaTermYears: v === "" ? null : Number(v) })}
              />
            </div>
          </Card>

          <Card title="PVSyst Details">
            <div style={formGridCols2}>
              <LabeledInput
                label="Net Yield (MWh/yr)"
                type="number"
                value={econ.pvsystYieldMWh ?? ""}
                onChange={(v) => setEcon({ ...econ, pvsystYieldMWh: v === "" ? null : Number(v) })}
              />
              <LabeledInput
                label="Degradation (%/yr)"
                type="number"
                value={econ.pvsystDegradationPct ?? ""}
                onChange={(v) => setEcon({ ...econ, pvsystDegradationPct: v === "" ? null : Number(v) })}
              />
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Generic Financial Model" action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                style={ghostButton}
                onClick={() => alert("Stub: export financial summary CSV")}
              >
                Export CSV
              </button>
              <button
                type="button"
                style={ghostButton}
                onClick={() => alert("Stub: export financial summary PDF")}
              >
                Export PDF
              </button>
            </div>
          }>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat label="Est. Annual Revenue" value={`$${annualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <Stat label="ITC Value" value={econ.itcEligiblePct != null && econ.capexPerKw != null ? `${econ.itcEligiblePct}% of capex` : "Set % and capex"} />
              <Stat label="REC Contribution" value={econ.recPrice ? `$${econ.recPrice}/MWh` : "Add REC price"} />
              <Stat label="PPA Term" value={econ.ppaTermYears ? `${econ.ppaTermYears} yrs` : "Set term"} />
              <Stat label="Degradation" value={econ.pvsystDegradationPct != null ? `${econ.pvsystDegradationPct}%/yr` : "Set degradation"} />
              <Stat label="CapEx" value={econ.capexPerKw != null ? `$${econ.capexPerKw}/kW` : "Add CapEx"} />
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
              This is a lightweight snapshot. For full rigor, plug these inputs into your detailed model.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#374151" }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#374151" }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 12px",
        background: "#f9fafb",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{value}</div>
    </div>
  );
}

const formGridCols2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  color: "#111827",
  background: "#fff",
};

const ghostButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  cursor: "pointer",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 600,
  fontSize: 12,
  color: "#6b7280",
  position: "sticky",
  top: 0,
  background: "#f9fafb",
  zIndex: 1,
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 12,
  color: "#111827",
};
