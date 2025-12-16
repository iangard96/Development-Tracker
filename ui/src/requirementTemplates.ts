import btmGround from "./btm-ground.json";
import btmRooftop from "./btm-rooftop.json";
import ftmGroundCommunitySolar from "./ftm-ground-community-solar.json";
import ftmRooftopCommunitySolar from "./ftm-rooftop-community-solar.json";

export type RequirementLabel =
  | "Engineering"
  | "Permitting/Compliance"
  | "Financing"
  | "Interconnection"
  | "Site Control"
  | "Construction/Execution";

const REQ_COLUMN_TO_LABEL: Record<string, RequirementLabel> = {
  "Site Control": "Site Control",
  Engineering: "Engineering",
  Interconnection: "Interconnection",
  "Permitting / Compliance": "Permitting/Compliance",
  Financing: "Financing",
  "Construction / Execution": "Construction/Execution",
};

type TemplateKey =
  | "BTM Ground"
  | "BTM Rooftop"
  | "FTM Ground Community Solar"
  | "FTM Rooftop Community Solar";

type RawRow = {
  Activity: string;
} & Partial<Record<keyof typeof REQ_COLUMN_TO_LABEL, string>>;

const RAW_TEMPLATES: Record<TemplateKey, RawRow[]> = {
  "BTM Ground": btmGround as RawRow[],
  "BTM Rooftop": btmRooftop as RawRow[],
  "FTM Ground Community Solar": ftmGroundCommunitySolar as RawRow[],
  "FTM Rooftop Community Solar": ftmRooftopCommunitySolar as RawRow[],
};

export type RequirementTemplateEntry = {
  activity: string;
  requirements: RequirementLabel[];
};

export function normalizeActivityName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function toRequirementEntries(rawRows: RawRow[]): RequirementTemplateEntry[] {
  return rawRows.map(({ Activity, ...rest }) => {
    const requirements: RequirementLabel[] = [];
    Object.entries(REQ_COLUMN_TO_LABEL).forEach(([col, label]) => {
      const val = (rest as any)[col];
      if (val && String(val).trim() !== "") {
        requirements.push(label);
      }
    });
    return { activity: Activity, requirements };
  });
}

const REQUIREMENT_TEMPLATES: Record<TemplateKey, RequirementTemplateEntry[]> = {
  "BTM Ground": toRequirementEntries(RAW_TEMPLATES["BTM Ground"]),
  "BTM Rooftop": toRequirementEntries(RAW_TEMPLATES["BTM Rooftop"]),
  "FTM Ground Community Solar": toRequirementEntries(RAW_TEMPLATES["FTM Ground Community Solar"]),
  "FTM Rooftop Community Solar": toRequirementEntries(RAW_TEMPLATES["FTM Rooftop Community Solar"]),
};

export function getRequirementTemplateLookup(projectType: string | null | undefined) {
  const requested = (projectType ?? "").trim().toLowerCase();
  const key = (Object.keys(REQUIREMENT_TEMPLATES).find(
    (k) => k.toLowerCase() === requested,
  ) ?? "") as TemplateKey;
  if (!REQUIREMENT_TEMPLATES[key]) return null;
  const map = new Map<string, Set<RequirementLabel>>();
  REQUIREMENT_TEMPLATES[key].forEach((row) => {
    map.set(normalizeActivityName(row.activity), new Set(row.requirements));
  });
  return map;
}

function tokenSet(str: string) {
  return new Set(
    str
      .split(" ")
      .filter(Boolean),
  );
}

export function findRequirementsForActivity(
  lookup: Map<string, Set<RequirementLabel>>,
  activityName: string,
): Set<RequirementLabel> | null {
  const norm = normalizeActivityName(activityName);
  if (lookup.has(norm)) {
    return lookup.get(norm)!;
  }

  // 1) Fast partial checks
  for (const [k, v] of lookup.entries()) {
    if (k.includes(norm) || norm.includes(k)) {
      if (v.size > 0) return v;
    }
  }

  // 2) Token overlap heuristic
  const targetTokens = tokenSet(norm);
  let best: { score: number; reqs: Set<RequirementLabel> } | null = null;
  for (const [k, v] of lookup.entries()) {
    const otherTokens = tokenSet(k);
    const shared = [...targetTokens].filter((t) => otherTokens.has(t));
    const score = shared.length / Math.max(1, targetTokens.size);
    if (score > 0.5 && v.size > 0 && (!best || score > best.score)) {
      best = { score, reqs: v };
    }
  }
  if (best?.reqs) return best.reqs;
  return null;
}
