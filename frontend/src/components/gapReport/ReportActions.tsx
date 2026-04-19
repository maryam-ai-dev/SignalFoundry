"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { GapReport } from "./types";

interface ReportActionsProps {
  runId: string;
  report: GapReport;
  onReportUpdated: (report: GapReport) => void;
}

interface VersionSummary {
  versionId?: string;
  id?: string;
  revision_number: number;
  schema_version?: number;
  reason: "RESCORE" | "REFRESH";
  created_at?: string;
  createdAt?: string;
}

export default function ReportActions({
  runId,
  report,
  onReportUpdated,
}: ReportActionsProps) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<VersionSummary[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [urlModal, setUrlModal] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, report.revision_number]);

  async function loadHistory() {
    try {
      const res = await apiFetch(`/api/research/runs/${runId}/gap-report/history`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch {}
  }

  async function save() {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/research/runs/${runId}/gap-report/save`, {
        method: "POST",
      });
      setToast(res.ok ? "Saved to Vault" : "Save failed");
    } catch {
      setToast("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function share() {
    const url = `${window.location.origin}/research/runs/${runId}/gap-report`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => setToast("Link copied"),
        () => setUrlModal(url)
      );
    } else {
      setUrlModal(url);
    }
  }

  function startScan() {
    const idea = encodeURIComponent(report.idea_description || "");
    router.push(`/research?prefill=${idea}&mode=SCAN`);
  }

  async function rescore() {
    setRescoring(true);
    try {
      const res = await apiFetch(`/api/research/runs/${runId}/gap-report/rescore`, {
        method: "POST",
      });
      if (!res.ok) {
        setToast("Re-score failed — report preserved");
        return;
      }
      const next = await res.json();
      onReportUpdated(next);
      setToast("Re-scored");
    } catch {
      setToast("Re-score failed — report preserved");
    } finally {
      setRescoring(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await apiFetch(`/api/research/runs/${runId}/gap-report/refresh`, {
        method: "POST",
      });
      if (!res.ok && res.status !== 202) {
        setToast("Refresh failed — report preserved");
        setRefreshing(false);
        return;
      }
      setToast("Refreshing evidence — this can take a minute");
      const start = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - start > 180_000) {
          clearInterval(poll);
          setRefreshing(false);
          return;
        }
        try {
          const r = await apiFetch(`/api/research/runs/${runId}/gap-report`);
          if (r.ok) {
            const updated: GapReport = await r.json();
            if ((updated.revision_number ?? 0) > (report.revision_number ?? 0)) {
              clearInterval(poll);
              onReportUpdated(updated);
              setRefreshing(false);
              setToast("Evidence refreshed");
            }
          }
        } catch {}
      }, 4000);
    } catch {
      setToast("Refresh failed — report preserved");
      setRefreshing(false);
    }
  }

  function download() {
    const md = renderMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gap-report-${runId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasHistory = Array.isArray(history) && history.length > 0;

  return (
    <section className="space-y-2 rounded-lg border border-[--border] bg-[--bg-panel] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={saving} variant="primary">
          {saving ? "Saving…" : "Save report"}
        </Button>
        <Button onClick={share}>Share report</Button>
        <Button onClick={startScan}>Start a scan from this idea</Button>
        <Button onClick={rescore} disabled={rescoring || refreshing}>
          {rescoring ? "Re-scoring…" : "Re-score report"}
        </Button>
        <Button onClick={refresh} disabled={rescoring || refreshing}>
          {refreshing ? "Refreshing evidence…" : "Refresh evidence"}
        </Button>
        <Button onClick={download}>Download as markdown</Button>
        {hasHistory && (
          <Button onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? "Hide history" : "View history"}
          </Button>
        )}
      </div>

      {toast && (
        <p className="rounded bg-[--bg-secondary] px-2 py-1 font-mono text-[10px] text-[--text-secondary]">
          {toast}
        </p>
      )}

      {historyOpen && hasHistory && (
        <ul className="space-y-1 pt-2">
          {history!.map((v, i) => {
            const when = v.created_at || v.createdAt || "";
            return (
              <li
                key={v.versionId || v.id || i}
                className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5"
              >
                <span className="rounded bg-[--bg-panel] px-1.5 py-0.5 font-mono text-[9px] uppercase text-[--text-secondary]">
                  {v.reason}
                </span>
                <span className="font-mono text-[10px] text-[--text-muted]">
                  rev {v.revision_number}
                  {typeof v.schema_version === "number" && ` · schema ${v.schema_version}`}
                </span>
                <span className="ml-auto font-mono text-[10px] text-[--text-muted]">
                  {when.slice(0, 10)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {urlModal && (
        <ClipboardFallbackModal url={urlModal} onClose={() => setUrlModal(null)} />
      )}
    </section>
  );
}

function Button({
  onClick,
  disabled,
  variant = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary";
  children: React.ReactNode;
}) {
  const base =
    "rounded-md border px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50";
  const cls =
    variant === "primary"
      ? `${base} border-transparent bg-[--primary] text-white hover:opacity-90`
      : `${base} border-[--border] bg-[--bg-secondary] text-[--text-secondary] hover:text-white`;
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

function ClipboardFallbackModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-lg border border-[--border] bg-[--bg-panel] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white">Copy this link:</p>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-xs text-[--text-secondary]"
        />
        <button
          onClick={onClose}
          className="rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function renderMarkdown(report: GapReport): string {
  const lines: string[] = [];
  lines.push(`# Gap report`);
  lines.push("");
  lines.push(`> ${report.idea_description}`);
  lines.push("");
  lines.push(`**Verdict band:** ${report.verdict_band}`);
  lines.push(`**Verdict:** ${report.single_verdict || report.verdict}`);
  lines.push(`**Domain:** ${report.domain} (${report.domain_confidence})`);
  if (typeof report.revision_number === "number") {
    lines.push(`**Revision:** ${report.revision_number}`);
  }
  lines.push("");
  lines.push("## Axes");
  for (const a of report.axes || []) {
    lines.push(
      `- **${a.name}** — score ${a.score} (weight ${a.weight.toFixed(2)}, n=${a.raw_count}, ${a.confidence})`
    );
  }

  const sections: [string, typeof report.prior_art][] = [
    ["Prior art", report.prior_art],
    ["Research", report.research_citations],
    ["Market", report.market_citations],
    ["Funding", report.funding_citations],
  ];
  for (const [title, list] of sections) {
    if (!list || list.length === 0) continue;
    lines.push("");
    lines.push(`## ${title}`);
    for (const c of list) {
      const label = c.title || c.url;
      lines.push(`- [${label}](${c.url})${c.year ? ` (${c.year})` : ""}`);
    }
  }
  return lines.join("\n");
}
