// ui/src/Lease.tsx
import React, { useEffect, useMemo, useState } from "react";
import SaveAsPdfButton from "./SaveAsPdfButton";
import logo from "../public/landcharge-logo.png";
import { useProject } from "./ProjectContext";
import { fetchProjectEconomics, updateProjectEconomics } from "./api";
import type { ProjectEconomics } from "./types";

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
  baseRentPerAcre: number;
  acres: number;
  optionPayment: number;
  constructionPayment: number;
  frequency: "Annual" | "Monthly";
  termYears: number;
  leasedAreaImage?: string;
  leasedAreaImageName?: string;
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
    baseRentPerAcre: 0,
    acres: 0,
    optionPayment: 0,
    constructionPayment: 0,
    frequency: "Annual",
    termYears: 25,
    leasedAreaImage: undefined,
    leasedAreaImageName: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payments = useMemo<PaymentRow[]>(() => {
    const list: PaymentRow[] = [];
    const base = lease.baseRentPerAcre > 0 && lease.acres > 0
      ? lease.baseRentPerAcre * lease.acres
      : lease.baseRent;
    if (lease.optionPayment > 0) {
      list.push({ period: 0, year: 0, amount: lease.optionPayment });
    }
    if (lease.constructionPayment > 0) {
      list.push({ period: 0, year: 0, amount: lease.constructionPayment });
    }
    const years = Math.max(1, Math.round(lease.termYears || 25));
    const freq = lease.frequency === "Monthly" ? 12 : 1;
    const esc = (lease.escalatorPct ?? 0) / 100;
    let current = base || 0;
    for (let y = 1; y <= years; y++) {
      for (let p = 1; p <= freq; p++) {
        const period = (y - 1) * freq + p;
        list.push({ period, year: y, amount: current / freq });
      }
      current = current * (1 + esc);
    }
    return list;
  }, [lease.baseRent, lease.baseRentPerAcre, lease.acres, lease.optionPayment, lease.constructionPayment, lease.escalatorPct, lease.frequency, lease.termYears]);

  const totalPayments = payments.reduce((sum, r) => sum + r.amount, 0);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetchProjectEconomics(projectId)
      .then((eco) => {
        setLease((cur) => ({
          ...cur,
          ownerName: eco.owner_name ?? "",
          counterparty: eco.counterparty ?? "",
          apn: eco.apn ?? "",
          legalDescription: eco.legal_description ?? "",
          optionTermYears: eco.option_term_years,
          constructionTermYears: eco.construction_term_years,
          leaseStart: eco.lease_start ?? "",
          leaseEnd: eco.lease_end ?? "",
          baseRent: eco.base_rent ?? 0,
          baseRentPerAcre: eco.base_rent_per_acre ?? 0,
          acres: eco.acres ?? 0,
          optionPayment: eco.option_payment ?? 0,
          constructionPayment: eco.construction_payment ?? 0,
          escalatorPct: eco.escalator_pct ?? 0,
          frequency: (eco.frequency as any) || "Annual",
          termYears: eco.term_years ?? 25,
          leasedAreaImage: eco.leased_area_image_url || undefined,
          leasedAreaImageName: eco.leased_area_image_name || undefined,
        }));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    setError(null);
    const payload: Partial<ProjectEconomics> = {
      owner_name: lease.ownerName,
      counterparty: lease.counterparty,
      apn: lease.apn,
      legal_description: lease.legalDescription,
      option_term_years: lease.optionTermYears,
      construction_term_years: lease.constructionTermYears,
      lease_start: lease.leaseStart || null,
      lease_end: lease.leaseEnd || null,
      base_rent: lease.baseRent,
      base_rent_per_acre: lease.baseRentPerAcre,
      acres: lease.acres,
      option_payment: lease.optionPayment,
      construction_payment: lease.constructionPayment,
      escalator_pct: lease.escalatorPct,
      frequency: lease.frequency,
      term_years: lease.termYears,
      leased_area_image_url: lease.leasedAreaImage || "",
      leased_area_image_name: lease.leasedAreaImageName || "",
    };
    try {
      await updateProjectEconomics(projectId, payload);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!projectId) {
    return (
      <div className="page-root" style={{ color: "#6b7280", fontSize: 14 }}>
        Select a project from the Project Portfolio to view lease info.
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
          <h2 className="page-subtitle">Lease Info</h2>
          {loading && <div style={{ fontSize: 12, color: "#6b7280" }}>Loading lease info…</div>}
          {error && <div style={{ fontSize: 12, color: "crimson" }}>{error}</div>}
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
          <button
            type="button"
            onClick={handleSave}
            style={{ ...ghostButton, background: "#111827", color: "#fff", borderColor: "#111827" }}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <img
            src={logo}
            alt="Land Charge"
            style={{ height: 60, width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            Total (incl. option/construction) ≈ ${totalPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}.
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
      </div>

      <div style={{ marginTop: 16 }}>
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
              label="Base Rent ($/acre/yr)"
              type="number"
              value={lease.baseRentPerAcre || ""}
              onChange={(v) => setLease({ ...lease, baseRentPerAcre: v === "" ? 0 : Number(v) })}
            />
            <LabeledInput
              label="Acres"
              type="number"
              value={lease.acres || ""}
              onChange={(v) => setLease({ ...lease, acres: v === "" ? 0 : Number(v) })}
            />
            <LabeledInput
              label="Option Payment ($)"
              type="number"
              value={lease.optionPayment || ""}
              onChange={(v) => setLease({ ...lease, optionPayment: v === "" ? 0 : Number(v) })}
            />
            <LabeledInput
              label="Construction Payment ($)"
              type="number"
              value={lease.constructionPayment || ""}
              onChange={(v) => setLease({ ...lease, constructionPayment: v === "" ? 0 : Number(v) })}
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
