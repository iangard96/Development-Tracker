// ui/src/types.ts

export type StepStatus = "" | "Not Started" | "In Progress" | "Completed" | "Not Applicable";

export type DevType =
  | ""
  | "Interconnection"
  | "Permitting"
  | "Due Diligence"
  | "Site Control"
  | "Engineering"
  | "Financing"
  | "Construction / Execution";

export interface DevStep {
  id: number;
  risk_heatmap?: string | null;
  name: string;
  phase: number | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  status: StepStatus | null;
  development_type: DevType | null;
  planned_spend: number | null;
  actual_spend: number | null;
  // FK to Project.id (nullable for now)
  project: number | null;
  sequence?: number | null;
  // optional metadata
  purpose_related_activity?: number | string | null;
  agency?: string | null;
  responsible_party?: string | null;
  responsible_individual?: string | null;
  process?: string | null;
  link?: string | null;
  requirement?: string | null;
  site_control_flag?: string | null;
  engineering_flag?: string | null;
  interconnection_flag?: string | null;
  permitting_compliance_flag?: string | null;
  financing_flag?: string | null;
  construction_execution_flag?: string | null;
  storage_hybrid_impact?: string | null;
  owner?: string | null;
  milestones_ntp_gates?: string | null;
}

// Project record from steps_project table / ProjectSerializer
export type Project = {
  id: number;
  project_name: string;
  legal_name: string;
  project_type:
    | "BTM Rooftop"
    | "BTM Ground"
    | "FTM Rooftop Community Solar"
    | "FTM Ground Community Solar"
    | null;
  project_details: "GM_FIXED" | "GM_TRACK" | "BALLASTED" | "ROOFTOP" | null;
  offtake_structure: "FTM_UTIL" | "FTM_DIST" | "BTM" | null;
  size_ac_mw: number | null;
  size_dc_mw: number | null;
  lease_option_start_date?: string | null;
  lease_option_expiration_date?: string | null;
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  county: string | null;
  city: string | null;
  address: string | null;
  other: string | null;
  // these aren't in the serializer yet, but can exist later
  created_at?: string;
  updated_at?: string;
};

export type ProjectContact = {
  id: number;
  project: number; // FK id
  organization: string | null;
  type: string | null;
  responsibility: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  phone1: string | null;
  phone2: string | null;
};

export type ProjectEconomics = {
  id: number;
  project: number;
  owner_name: string;
  counterparty: string;
  apn: string;
  legal_description: string;
  option_term_years: number | null;
  construction_term_years: number | null;
  lease_start: string | null;
  lease_end: string | null;
  base_rent: number | null;
  base_rent_per_acre: number | null;
  acres: number | null;
  option_payment: number | null;
  construction_payment: number | null;
  escalator_pct: number | null;
  frequency: "Annual" | "Monthly" | string;
  term_years: number | null;
  leased_area_image_url: string;
  leased_area_image_name: string;
  lease_template_url: string;
  lease_template_name: string;
  meta: Record<string, unknown>;
};

export type ProjectIncentives = {
  id: number;
  project: number;
  itc_eligible_pct: number | null;
  rec_price: number | null;
  rec_tenor_years: number | null;
  ppa_price: number | null;
  ppa_esc_pct: number | null;
  ppa_term_years: number | null;
  pvsyst_yield_mwh: number | null;
  pvsyst_deg_pct: number | null;
  capex_per_kw: number | null;
  opex_per_kw_yr: number | null;
  meta: Record<string, unknown>;
};

export type ProjectFinanceSystemInput = {
  dc_kw?: number;
  ac_kw?: number;
  capex_per_w?: number;
  total_capex?: number;
};

export type ProjectFinanceProductionInput = {
  year1_mwh?: number;
  degradation_pct?: number;
};

export type ProjectFinanceRevenueInput = {
  ppa_price_mwh?: number;
  ppa_escalator_pct?: number;
  rec_price_mwh?: number;
  rec_term_years?: number | null;
};

export type ProjectFinanceOpexInput = {
  fixed_per_kw_yr?: number;
  fixed_annual?: number;
  variable_per_mwh?: number;
  escalator_pct?: number;
};

export type ProjectFinanceLeaseInput = {
  annual?: number;
  escalator_pct?: number;
};

export type ProjectFinanceDebtInput = {
  debt_pct?: number;
  interest_pct?: number;
  tenor_years?: number;
  dscr_target?: number;
  upfront_fee_pct?: number;
  closing_costs?: number;
};

export type ProjectFinanceIncentivesInput = {
  itc_pct?: number;
  itc_basis_reduction_pct?: number | null;
  ptc_per_kwh?: number;
  ptc_term_years?: number;
  ptc_escalator_pct?: number;
};

export type ProjectFinanceAnalysisInput = {
  term_years?: number;
  discount_rate_pct?: number;
  inflation_pct?: number;
  salvage_pct_capex?: number;
};

export type ProjectFinanceRunInputs = {
  system?: ProjectFinanceSystemInput;
  production?: ProjectFinanceProductionInput;
  revenue?: ProjectFinanceRevenueInput;
  opex?: ProjectFinanceOpexInput;
  land_lease?: ProjectFinanceLeaseInput;
  lease?: ProjectFinanceLeaseInput;
  debt?: ProjectFinanceDebtInput;
  incentives?: ProjectFinanceIncentivesInput;
  analysis?: ProjectFinanceAnalysisInput;
};

export type ProjectFinanceRunOutputs = {
  levered_irr: number | null;
  unlevered_irr: number | null;
  ppa_price: number | null;
  npv: number | null;
  itc_credit?: number | null;
  npv_unlevered?: number | null;
  min_dscr?: number | null;
};

export type ProjectFinanceRunCashflow = {
  label: string;
  values: number[];
};

export type ProjectFinanceRun = {
  id: number;
  project: number;
  inputs: ProjectFinanceRunInputs;
  outputs: ProjectFinanceRunOutputs;
  cashflows: ProjectFinanceRunCashflow[];
  run_by: string;
  created_at: string;
};

export type PermitRequirement = {
  id: number;
  project: number;
  level: "Federal" | "State" | "Local" | "" | string;
  applicable: string;
  agency: string;
  required_permit: string;
  includes: string;
  cup_condition: string;
  responsible_party: string;
  responsible_individual: string;
  status: string;
  fee: string;
  start_date: string | null;
  turnaround_days: number | null;
  completion_date: string | null;
  agency_contact: string;
  agency_phone: string;
  requirements: string;
  approval_doc_link: string;
  comments: string;
};
