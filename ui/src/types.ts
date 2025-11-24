// ui/src/types.ts
export type StepStatus = "" | "Not Started" | "In Progress" | "Completed";

export interface DevStep {
  id: number;
  name: string;
  phase: number | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  status: StepStatus | null;
};

// ui/src/types.ts
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
  created_at?: string;
  updated_at?: string;
};

