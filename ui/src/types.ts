// ui/src/types.ts

export type StepStatus = "" | "Not Started" | "In Progress" | "Completed" | "Not Applicable";

export type DevType = "" | "Interconnection" | "Permitting" | "Due Diligence";

export interface DevStep {
  id: number;
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
  // optional metadata
  purpose_related_activity?: number | string | null;
  agency?: string | null;
  responsible_party?: string | null;
  responsible_individual?: string | null;
  process?: string | null;
  link?: string | null;
  requirement?: string | null;
}

// Project record from steps_project table / ProjectSerializer
export type Project = {
  id: number;
  project_name: string;
  legal_name: string;
  project_type: "GM" | "RT" | "OT" | null;
  project_details: "GM_FIXED" | "GM_TRACK" | "BALLASTED" | "ROOFTOP" | null;
  offtake_structure: "FTM_UTIL" | "FTM_DIST" | "BTM" | null;
  size_ac_mw: number | null;
  size_dc_mw: number | null;
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
