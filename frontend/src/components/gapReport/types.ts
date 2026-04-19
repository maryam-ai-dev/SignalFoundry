export type VerdictBand = "strong" | "worth" | "crowded";
export type AxisBand = "red" | "amber" | "light_green" | "dark_green";

export interface GapAxis {
  name: string;
  score: number;
  weight: number;
  confidence: string;
  raw_count: number;
  band: AxisBand;
}

export interface GapCitation {
  source: string;
  record_type: string;
  title: string;
  url: string;
  doi?: string | null;
  year?: number | null;
  funder?: string | null;
  award_amount?: number | null;
  closing_date?: string | null;
  confidence: string;
  jurisdiction?: string;
}

export interface GapReport {
  idea_description: string;
  domain: string;
  domain_confidence: string;
  domain_rationale?: string;
  verdict: string;
  single_verdict: string;
  verdict_band: VerdictBand;
  low_signal_flag?: boolean;
  data_freshness?: Record<string, string>;
  axis_weights?: Record<string, number>;
  axes: GapAxis[];
  prior_art?: GapCitation[];
  research_citations?: GapCitation[];
  market_citations?: GapCitation[];
  funding_citations?: GapCitation[];
  schema_version?: number;
  revision_number?: number;
}
