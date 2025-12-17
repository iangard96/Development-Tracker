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
  capacityKw: number | "";
  capexPerW: number | "";
  capexTotal: number | "";
  escalatorPct: number | "";
  ppaEscalatorPct: number | "";
  opexPerKwYr: number | "";
  opexEscalatorPct: number | "";
  opexFixedAnnual: number | "";
  opexVariablePerMwh: number | "";
  leaseCost: number | "";
  leaseEscalatorPct: number | "";
  miscCost: number | "";
  ppaPrice: number | "";
  recPrice: number | "";
  itcEligiblePct: number | "";
  pvsystYieldMWh: number | "";
  pvsystDegPct: number | "";
  recTermYears: number | "";
  debtPct: number | "";
  debtRatePct: number | "";
  debtTenorYears: number | "";
  discountRatePct: number | "";
  termYears: number | "";
  salvagePctCapex: number | "";
};

type ModelOutputs = {
  leveredIrr: number | null;
  unleveredIrr: number | null;
  ppaPrice: number | null;
  npv: number | null;
  itcCredit: number | null;
  minDscr: number | null;
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
    capacityKw: 1000,
    capexPerW: 1.75,
    capexTotal: "",
    escalatorPct: 2,
    ppaEscalatorPct: 2,
    opexPerKwYr: 18,
    opexEscalatorPct: 2,
    opexFixedAnnual: 0,
    opexVariablePerMwh: 0,
    leaseCost: 12000,
    leaseEscalatorPct: 0,
    miscCost: 5000,
    ppaPrice: 55,
    recPrice: 0,
    itcEligiblePct: 30,
    pvsystYieldMWh: 2200,
    pvsystDegPct: 0.5,
    recTermYears: "",
    debtPct: 0,
    debtRatePct: 0,
    debtTenorYears: "",
    discountRatePct: 8,
    termYears: 25,
    salvagePctCapex: 0,
  });
  const [modelOutputs, setModelOutputs] = useState<ModelOutputs>({
    leveredIrr: null,
    unleveredIrr: null,
    ppaPrice: null,
    npv: null,
    itcCredit: null,
    minDscr: null,
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
        setModelInputs((prev) => ({
          ...prev,
          recPrice: inc.rec_price ?? prev.recPrice ?? 0,
          itcEligiblePct: inc.itc_eligible_pct ?? prev.itcEligiblePct ?? 30,
          pvsystYieldMWh: inc.pvsyst_yield_mwh ?? prev.pvsystYieldMWh ?? 2200,
          pvsystDegPct: inc.pvsyst_deg_pct ?? prev.pvsystDegPct ?? 0.5,
          ppaPrice: inc.ppa_price ?? prev.ppaPrice,
          ppaEscalatorPct: inc.ppa_esc_pct ?? prev.ppaEscalatorPct ?? prev.escalatorPct,
          recTermYears: inc.rec_tenor_years ?? prev.recTermYears ?? "",
        }));
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
      const miscAnnual = modelInputs.miscCost === "" ? 0 : Number(modelInputs.miscCost);
      const fixedAnnual =
        (modelInputs.opexFixedAnnual === "" ? 0 : Number(modelInputs.opexFixedAnnual)) + miscAnnual;
      const payload = {
        system: {
          dc_kw: modelInputs.capacityKw === "" ? undefined : Number(modelInputs.capacityKw),
          capex_per_w: modelInputs.capexPerW === "" ? undefined : Number(modelInputs.capexPerW),
          total_capex: modelInputs.capexTotal === "" ? undefined : Number(modelInputs.capexTotal),
        },
        production: {
          year1_mwh: modelInputs.pvsystYieldMWh === "" ? undefined : Number(modelInputs.pvsystYieldMWh),
          degradation_pct: modelInputs.pvsystDegPct === "" ? undefined : Number(modelInputs.pvsystDegPct),
        },
        revenue: {
          ppa_price_mwh: modelInputs.ppaPrice === "" ? undefined : Number(modelInputs.ppaPrice),
          ppa_escalator_pct: modelInputs.ppaEscalatorPct === "" ? undefined : Number(modelInputs.ppaEscalatorPct ?? modelInputs.escalatorPct),
          rec_price_mwh: modelInputs.recPrice === "" ? undefined : Number(modelInputs.recPrice),
          rec_term_years: modelInputs.recTermYears === "" ? undefined : Number(modelInputs.recTermYears),
        },
        opex: {
          fixed_per_kw_yr: modelInputs.opexPerKwYr === "" ? undefined : Number(modelInputs.opexPerKwYr),
          fixed_annual: fixedAnnual === 0 ? undefined : fixedAnnual,
          variable_per_mwh: modelInputs.opexVariablePerMwh === "" ? undefined : Number(modelInputs.opexVariablePerMwh),
          escalator_pct: modelInputs.opexEscalatorPct === "" ? undefined : Number(modelInputs.opexEscalatorPct),
        },
        land_lease: {
          annual: modelInputs.leaseCost === "" ? undefined : Number(modelInputs.leaseCost),
          escalator_pct: modelInputs.leaseEscalatorPct === "" ? undefined : Number(modelInputs.leaseEscalatorPct),
        },
        debt: {
          debt_pct: modelInputs.debtPct === "" ? undefined : Number(modelInputs.debtPct),
          interest_pct: modelInputs.debtRatePct === "" ? undefined : Number(modelInputs.debtRatePct),
          tenor_years: modelInputs.debtTenorYears === "" ? undefined : Number(modelInputs.debtTenorYears),
        },
        incentives: {
          itc_pct: modelInputs.itcEligiblePct === "" ? undefined : Number(modelInputs.itcEligiblePct),
        },
        analysis: {
          term_years: modelInputs.termYears === "" ? undefined : Number(modelInputs.termYears),
          discount_rate_pct: modelInputs.discountRatePct === "" ? undefined : Number(modelInputs.discountRatePct),
          salvage_pct_capex: modelInputs.salvagePctCapex === "" ? undefined : Number(modelInputs.salvagePctCapex),
        },
      };
      const run = await runProjectFinanceModel(projectId, payload);
      setModelOutputs({
        leveredIrr: run.outputs.levered_irr,
        unleveredIrr: run.outputs.unlevered_irr,
        ppaPrice: run.outputs.ppa_price,
        npv: run.outputs.npv,
        itcCredit: run.outputs.itc_credit ?? null,
        minDscr: run.outputs.min_dscr ?? null,
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

      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
        This is a lightweight snapshot. For full rigor, plug these inputs into your detailed model.
      </p>

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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <LabeledInput
              label="$ / W"
              type="number"
              value={modelInputs.capexPerW}
              onChange={(v) => handleModelInputChange("capexPerW", v)}
            />
            <LabeledInput
              label="Total CapEx ($)"
              type="number"
              value={modelInputs.capexTotal}
              onChange={(v) => handleModelInputChange("capexTotal", v)}
            />
            <LabeledInput
              label="Capacity (kW)"
              type="number"
              value={modelInputs.capacityKw}
              onChange={(v) => handleModelInputChange("capacityKw", v)}
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
            <LabeledInput
              label="PPA Escalator (%)"
              type="number"
              value={modelInputs.ppaEscalatorPct}
              onChange={(v) => handleModelInputChange("ppaEscalatorPct", v)}
            />
            <LabeledInput
              label="REC Price ($/MWh)"
              type="number"
              value={modelInputs.recPrice}
              onChange={(v) => handleModelInputChange("recPrice", v)}
            />
            <LabeledInput
              label="REC Term (yrs)"
              type="number"
              value={modelInputs.recTermYears}
              onChange={(v) => handleModelInputChange("recTermYears", v)}
            />
            <LabeledInput
              label="ITC Eligible (%)"
              type="number"
              value={modelInputs.itcEligiblePct}
              onChange={(v) => handleModelInputChange("itcEligiblePct", v)}
            />
            <LabeledInput
              label="Net Yield (MWh/yr)"
              type="number"
              value={modelInputs.pvsystYieldMWh}
              onChange={(v) => handleModelInputChange("pvsystYieldMWh", v)}
            />
            <LabeledInput
              label="Degradation (%/yr)"
              type="number"
              value={modelInputs.pvsystDegPct}
              onChange={(v) => handleModelInputChange("pvsystDegPct", v)}
            />
            <LabeledInput
              label="O&M Escalator (%)"
              type="number"
              value={modelInputs.opexEscalatorPct}
              onChange={(v) => handleModelInputChange("opexEscalatorPct", v)}
            />
            <LabeledInput
              label="Fixed Opex ($/yr)"
              type="number"
              value={modelInputs.opexFixedAnnual}
              onChange={(v) => handleModelInputChange("opexFixedAnnual", v)}
            />
            <LabeledInput
              label="Variable Opex ($/MWh)"
              type="number"
              value={modelInputs.opexVariablePerMwh}
              onChange={(v) => handleModelInputChange("opexVariablePerMwh", v)}
            />
            <LabeledInput
              label="Lease Escalator (%)"
              type="number"
              value={modelInputs.leaseEscalatorPct}
              onChange={(v) => handleModelInputChange("leaseEscalatorPct", v)}
            />
            <LabeledInput
              label="Debt % of CapEx"
              type="number"
              value={modelInputs.debtPct}
              onChange={(v) => handleModelInputChange("debtPct", v)}
            />
            <LabeledInput
              label="Debt Rate (%)"
              type="number"
              value={modelInputs.debtRatePct}
              onChange={(v) => handleModelInputChange("debtRatePct", v)}
            />
            <LabeledInput
              label="Debt Tenor (yrs)"
              type="number"
              value={modelInputs.debtTenorYears}
              onChange={(v) => handleModelInputChange("debtTenorYears", v)}
            />
            <LabeledInput
              label="Analysis Term (yrs)"
              type="number"
              value={modelInputs.termYears}
              onChange={(v) => handleModelInputChange("termYears", v)}
            />
            <LabeledInput
              label="Discount Rate (%)"
              type="number"
              value={modelInputs.discountRatePct}
              onChange={(v) => handleModelInputChange("discountRatePct", v)}
            />
            <LabeledInput
              label="Salvage (% of CapEx)"
              type="number"
              value={modelInputs.salvagePctCapex}
              onChange={(v) => handleModelInputChange("salvagePctCapex", v)}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Stat label="Levered IRR" value={formatMaybePercent(modelOutputs.leveredIrr)} />
            <Stat label="Unlevered IRR" value={formatMaybePercent(modelOutputs.unleveredIrr)} />
            <Stat label="Modeled PPA" value={formatMaybeCurrency(modelOutputs.ppaPrice, "/MWh")} />
            <Stat label="NPV" value={formatMaybeCurrency(modelOutputs.npv)} />
            <Stat label="ITC Credit" value={formatMaybeCurrency(modelOutputs.itcCredit)} />
            <Stat label="Min DSCR" value={formatMaybeNumber(modelOutputs.minDscr)} />
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

function formatMaybeNumber(value: number | null) {
  if (value == null) return "--";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
