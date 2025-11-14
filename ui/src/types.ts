// Minimal type for this step of the UI.
// It maps your DB row fields used by the table.
export interface DevStep {
  id: number;
  name: string;       // maps to your "Development Steps" column via the serializer
  sequence?: number | null;
  status?: string | null;
}
