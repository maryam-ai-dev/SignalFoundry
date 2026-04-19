"use client";

import { useState } from "react";
import type { GapCitation, GapReport } from "./types";

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ReportFolds({ report }: { report: GapReport }) {
  const priorArt = (report.prior_art || []).slice(0, 3);
  const grants = (report.funding_citations || []).filter((g) => g.closing_date).slice(0, 5);
  const research = (report.research_citations || []).slice(0, 3);

  return (
    <div className="space-y-4">
      <Fold title="Prior art" defaultOpen>
        {priorArt.length === 0 ? (
          <p className="text-xs text-[--text-muted]">
            No direct prior art found — domain may be novel.
          </p>
        ) : (
          <ul className="space-y-2">
            {priorArt.map((c, i) => (
              <PatentRow key={i} citation={c} />
            ))}
          </ul>
        )}
      </Fold>

      <Fold title="Open grants" defaultOpen>
        {grants.length === 0 ? (
          <p className="text-xs text-[--text-muted]">No open grants found.</p>
        ) : (
          <ul className="space-y-2">
            {grants.map((g, i) => (
              <GrantRow key={i} citation={g} />
            ))}
            <GrantSummary grants={grants} />
          </ul>
        )}
      </Fold>

      <Fold title="Research" defaultOpen>
        {research.length === 0 ? (
          <p className="text-xs text-[--text-muted]">No research citations found.</p>
        ) : (
          <ul className="space-y-2">
            {research.map((r, i) => (
              <ResearchRow key={i} citation={r} />
            ))}
          </ul>
        )}
      </Fold>

      <BottomFold report={report} />
    </div>
  );
}

function Fold({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-[--border] bg-[--bg-panel]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-left"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[--text-muted]">
          {title}
        </span>
        <span className="font-mono text-[10px] text-[--text-muted]">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && <div className="border-t border-[--border] px-4 py-3">{children}</div>}
    </section>
  );
}

function CitationLink({ citation }: { citation: GapCitation }) {
  const [broken, setBroken] = useState(false);
  if (!citation.url || broken) {
    return (
      <span className="text-xs text-[--text-muted]">
        {citation.title}
        {citation.url && " (link may have changed)"}
      </span>
    );
  }
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      onError={() => setBroken(true)}
      className="text-xs text-[--text-secondary] hover:text-white hover:underline"
    >
      {citation.title}
    </a>
  );
}

function PatentRow({ citation }: { citation: GapCitation }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2">
      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-purple-300">
        Lens.org
      </span>
      {citation.jurisdiction && (
        <span className="rounded bg-[--bg-panel] px-1.5 py-0.5 font-mono text-[9px] text-[--text-muted]">
          {citation.jurisdiction}
        </span>
      )}
      <CitationLink citation={citation} />
      {citation.year && (
        <span className="ml-auto font-mono text-[10px] text-[--text-muted]">
          {citation.year}
        </span>
      )}
    </li>
  );
}

function GrantRow({ citation }: { citation: GapCitation }) {
  const days = daysUntil(citation.closing_date);
  const closingSoon = days !== null && days <= 60;
  return (
    <li className="flex items-center gap-2 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2">
      <span className="rounded bg-green-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-green-300">
        {citation.funder || citation.source}
      </span>
      <CitationLink citation={citation} />
      <span className="ml-auto flex items-center gap-2 font-mono text-[10px]">
        {citation.closing_date && (
          <span style={{ color: closingSoon ? "#FFAA40" : "rgba(255,255,255,0.5)" }}>
            closes {citation.closing_date}
            {closingSoon && days !== null && ` · ${days}d`}
          </span>
        )}
      </span>
    </li>
  );
}

function GrantSummary({ grants }: { grants: GapCitation[] }) {
  const amounts = grants
    .map((g) => g.award_amount)
    .filter((n): n is number => typeof n === "number");
  if (amounts.length === 0) return null;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  return (
    <li className="rounded-md bg-[--bg-panel] px-3 py-1.5 font-mono text-[10px] text-[--text-muted]">
      Avg award: {Math.round(avg).toLocaleString()}
    </li>
  );
}

function ResearchRow({ citation }: { citation: GapCitation }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2">
      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-blue-300">
        {citation.source}
      </span>
      <CitationLink citation={citation} />
      {citation.doi && (
        <a
          href={`https://doi.org/${citation.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto font-mono text-[10px] text-[--text-muted] hover:text-white hover:underline"
        >
          doi
        </a>
      )}
      {citation.year && (
        <span className="font-mono text-[10px] text-[--text-muted]">{citation.year}</span>
      )}
    </li>
  );
}

function BottomFold({ report }: { report: GapReport }) {
  const patentDate =
    (report.data_freshness && (report.data_freshness.lens_patent || report.data_freshness.patent)) ||
    "today";
  const lowSignalAxis = (report.axes || []).find((a) => a.raw_count > 0 && a.raw_count < 5);

  return (
    <section className="space-y-1 rounded-md bg-[--bg-panel] px-4 py-3">
      <p className="font-mono text-[10px] text-[--text-muted]">
        Patent evidence: Lens.org aggregation of USPTO / EPO / WIPO as of {patentDate}
      </p>
      <p className="font-mono text-[10px] text-[--text-muted]">
        Academic data lags 12–18 months
      </p>
      <p className="font-mono text-[10px] text-[--text-muted]">
        Market signal reflects public search and social data only
      </p>
      {lowSignalAxis && (
        <p className="font-mono text-[10px] text-amber-300">
          Low {lowSignalAxis.name.replace(/_/g, " ")} signal ({lowSignalAxis.raw_count} records) — treat this as a positive gap, not a red flag
        </p>
      )}
    </section>
  );
}
