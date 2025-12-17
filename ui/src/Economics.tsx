// ui/src/Economics.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "./ProjectContext";
import {
  fetchProjectIncentives,
  updateProjectIncentives,
  runProjectFinanceModel,
} from "./api";
import type { ProjectIncentives } from "./types";
import logo from "../public/landcharge-logo.png";
import SaveAsPdfButton from "./SaveAsPdfButton";

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

type ModelInputs = {
  capexPerW: number | "";
  escalatorPct: number | "";
  opexPerKwYr: number | "";
  leaseCost: number | "";
  miscCost: number | "";
  ppaPrice: number | "";
};

type ModelOutputs = {
  leveredIrr: number | null;
  unleveredIrr: number | null;
  ppaPrice: number | null;
  npv: number | null;
  itcCredit: number | null;
};

type CashFlowRow = {
  label: string;
  values: number[];
};

export default function Economics() {
  const { projectId, project } = useProject();
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
  const [modelInputs, setModelInputs] = useState<ModelInputs>({
    capexPerW: 1.75,
    escalatorPct: 2,
    opexPerKwYr: 18,
    leaseCost: 12000,
    miscCost: 5000,
    ppaPrice: 55,
  });
  const [modelOutputs, setModelOutputs] = useState<ModelOutputs>({
    leveredIrr: null,
    unleveredIrr: null,
    ppaPrice: null,
    npv: null,
    itcCredit: null,
  });
  const [cashFlowRows, setCashFlowRows] = useState<CashFlowRow[]>([
    {
      label: "Revenue",
      values: [120000, 122400, 124848, 127345, 129892],
    },
    {
      label: "Opex",
      values: [-18000, -18360, -18727, -19101, -19483],
    },
    {
      label: "Lease",
      values: [-12000, -12000, -12000, -12000, -12000],
    },
    {
      label: "Net Cash",
      values: [90000, 92040, 94000, 96344, 98409],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const annualRevenue = useMemo(() => {
    const prod = econ.pvsystYieldMWh ?? 0;
    const ppa = econ.ppaPrice ?? 0;
    const rec = econ.recPrice ?? 0;
    return prod * (ppa + rec);
  }, [econ.pvsystYieldMWh, econ.ppaPrice, econ.recPrice]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetchProjectIncentives(projectId)
      .then((inc) => {
        setEcon({
          itcEligiblePct: inc.itc_eligible_pct ?? 30,
          recPrice: inc.rec_price,
          recTenorYears: inc.rec_tenor_years,
          ppaPrice: inc.ppa_price,
          ppaEscPct: inc.ppa_esc_pct,
          ppaTermYears: inc.ppa_term_years,
          pvsystYieldMWh: inc.pvsyst_yield_mwh,
          pvsystDegradationPct: inc.pvsyst_deg_pct ?? 0.5,
          capexPerKw: inc.capex_per_kw,
          opexPerKwYr: inc.opex_per_kw_yr,
        });
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    setError(null);
    const payload: Partial<ProjectIncentives> = {
      itc_eligible_pct: econ.itcEligiblePct,
      rec_price: econ.recPrice,
      rec_tenor_years: econ.recTenorYears,
      ppa_price: econ.ppaPrice,
      ppa_esc_pct: econ.ppaEscPct,
      ppa_term_years: econ.ppaTermYears,
      pvsyst_yield_mwh: econ.pvsystYieldMWh,
      pvsyst_deg_pct: econ.pvsystDegradationPct,
      capex_per_kw: econ.capexPerKw,
      opex_per_kw_yr: econ.opexPerKwYr,
    };
    try {
      await updateProjectIncentives(projectId, payload);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleModelInputChange<K extends keyof ModelInputs>(key: K, value: string) {
    setModelInputs((prev) => ({
      ...prev,
      [key]: value === "" ? "" : Number(value),
    }));
  }

  async function handleRunModel() {
    if (!projectId) return;
    setRunLoading(true);
    setRunError(null);
    try {
      const payload = {
        capex_per_w: modelInputs.capexPerW === "" ? undefined : Number(modelInputs.capexPerW),
        escalator_pct: modelInputs.escalatorPct === "" ? undefined : Number(modelInputs.escalatorPct),
        opex_per_kw_yr: modelInputs.opexPerKwYr === "" ? undefined : Number(modelInputs.opexPerKwYr),
        lease_cost: modelInputs.leaseCost === "" ? undefined : Number(modelInputs.leaseCost),
        misc_cost: modelInputs.miscCost === "" ? undefined : Number(modelInputs.miscCost),
        ppa_price: modelInputs.ppaPrice === "" ? undefined : Number(modelInputs.ppaPrice),
        rec_price: econ.recPrice ?? undefined,
        itc_eligible_pct: econ.itcEligiblePct ?? undefined,
        pvsyst_deg_pct: econ.pvsystDegradationPct ?? undefined,
        base_yield_mwh: econ.pvsystYieldMWh ?? undefined,
      };
      const run = await runProjectFinanceModel(projectId, payload);
      setModelOutputs({
        leveredIrr: run.outputs.levered_irr,
        unleveredIrr: run.outputs.unlevered_irr,
        ppaPrice: run.outputs.ppa_price,
        npv: run.outputs.npv,
        itcCredit: run.outputs.itc_credit ?? null,
      });
      setCashFlowRows(run.cashflows || []);
    } catch (e: any) {
      setRunError(String(e));
    } finally {
      setRunLoading(false);
    }
  }

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
            Incentives, production, and a lightweight financial snapshot.
          </p>
          {loading && <div style={{ fontSize: 12, color: "#6b7280" }}>Loading economics???</div>}
          {error && <div style={{ fontSize: 12, color: "crimson" }}>{error}</div>}
        </div>
        <div className="print-hidden" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
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

      <Card title="Financial Model Sandbox" action={
        <button
          type="button"
          style={{ ...ghostButton, opacity: runLoading ? 0.6 : 1 }}
          onClick={handleRunModel}
          disabled={runLoading || !projectId}
        >
          {runLoading ? "Running..." : "Run"}
        </button>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <LabeledInput
              label="$ / W"
              type="number"
              value={modelInputs.capexPerW}
              onChange={(v) => handleModelInputChange("capexPerW", v)}
            />
            <LabeledInput
              label="Escalator (%)"
              type="number"
              value={modelInputs.escalatorPct}
              onChange={(v) => handleModelInputChange("escalatorPct", v)}
            />
            <LabeledInput
              label="O&M ($/kW/yr)"
              type="number"
              value={modelInputs.opexPerKwYr}
              onChange={(v) => handleModelInputChange("opexPerKwYr", v)}
            />
            <LabeledInput
              label="Lease ($/yr)"
              type="number"
              value={modelInputs.leaseCost}
              onChange={(v) => handleModelInputChange("leaseCost", v)}
            />
            <LabeledInput
              label="Misc ($/yr)"
              type="number"
              value={modelInputs.miscCost}
              onChange={(v) => handleModelInputChange("miscCost", v)}
            />
            <LabeledInput
              label="PPA Price ($/MWh)"
              type="number"
              value={modelInputs.ppaPrice}
              onChange={(v) => handleModelInputChange("ppaPrice", v)}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Stat label="Levered IRR" value={formatMaybePercent(modelOutputs.leveredIrr)} />
            <Stat label="Unlevered IRR" value={formatMaybePercent(modelOutputs.unleveredIrr)} />
            <Stat label="Modeled PPA" value={formatMaybeCurrency(modelOutputs.ppaPrice, "/MWh")} />
            <Stat label="NPV" value={formatMaybeCurrency(modelOutputs.npv)} />
            <Stat label="ITC Credit" value={formatMaybeCurrency(modelOutputs.itcCredit)} />
            {runError && <div style={{ fontSize: 12, color: "crimson" }}>{runError}</div>}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <thead>
              <tr>
                <th style={tableHeaderCell}></th>
                {[1, 2, 3, 4, 5].map((year) => (
                  <th key={year} style={tableHeaderCell}>Year {year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cashFlowRows.map((row) => (
                <tr key={row.label}>
                  <td style={tableRowHeader}>{row.label}</td>
                  {row.values.map((val, idx) => (
                    <td key={idx} style={tableCell}>${val.toLocaleString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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

function formatMaybePercent(value: number | null) {
  if (value == null) return "--";
  return `${value.toFixed(1)}%`;
}

function formatMaybeCurrency(value: number | null, suffix = "") {
  if (value == null) return "--";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
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

const tableHeaderCell: React.CSSProperties = {
  textAlign: "right",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const tableRowHeader: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  fontSize: 12,
  color: "#374151",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tableCell: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f3f4f6",
  textAlign: "right",
  fontSize: 12,
  color: "#111827",
  whiteSpace: "nowrap",
};
