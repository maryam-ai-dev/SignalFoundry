"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  DIGEST_DAYS,
  useWorkspaceStore,
  type DigestDay,
} from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface Campaign {
  campaignId?: string;
  id?: string;
  name: string;
  goalType?: string;
  status?: string;
}

interface VoiceSample {
  sampleId?: string;
  id?: string;
  title?: string;
  text?: string;
  wordCount?: number;
  createdAt?: string;
}

interface VoiceProfile {
  confidenceState?: string;
  state?: string;
  version?: string;
  samples?: VoiceSample[];
}

interface ConnectorStatus {
  platform: string;
  status: string;
}

interface RefreshConfig {
  cadence?: string;
  nextRunAt?: string;
}

const DAY_LABEL: Record<DigestDay, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const CONNECTORS = [
  { id: "reddit", label: "Reddit" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "producthunt", label: "Product Hunt" },
  { id: "substack", label: "Substack" },
  { id: "discord", label: "Discord" },
];

export default function SettingsPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const accountMode = useWorkspaceStore((s) => s.accountMode);
  const digestDay = useWorkspaceStore((s) => s.digestDay);
  const setDigestDay = useWorkspaceStore((s) => s.setDigestDay);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  const isInvestor = accountMode === "INVESTOR";

  // Workspace
  const [name, setName] = useState<string>("");
  const [niche, setNiche] = useState<string>("");

  // Voice
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const [sampleText, setSampleText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaignName, setNewCampaignName] = useState("");

  // Connectors
  const [connectorStatuses, setConnectorStatuses] = useState<Record<string, string>>({});

  // Refresh
  const [refreshConfig, setRefreshConfig] = useState<RefreshConfig | null>(null);
  const [cadenceDraft, setCadenceDraft] = useState("WEEKLY");

  // Digest
  const [digestPreview, setDigestPreview] = useState<Record<string, unknown> | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [digestToast, setDigestToast] = useState("");

  const loadAll = useCallback(async () => {
    if (!workspaceId) return;

    if (workspace) {
      if (typeof workspace.name === "string") setName(workspace.name);
      if (typeof workspace.productName === "string") setNiche(workspace.productName);
      else if (typeof workspace.niche === "string") setNiche(workspace.niche);
    }

    apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`)
      .then(async (r) => {
        if (r.ok) setVoiceProfile(await r.json());
        else setVoiceError("Voice profile unavailable");
      })
      .catch(() => setVoiceError("Voice profile unavailable"));

    apiFetch(`/api/campaigns?workspaceId=${workspaceId}`)
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) setCampaigns(data);
        }
      })
      .catch(() => {});

    const statusEntries: [string, string][] = [];
    await Promise.all(
      CONNECTORS.map(async (c) => {
        try {
          const res = await apiFetch(
            `/api/workspaces/${workspaceId}/connectors/${c.id}/status`
          );
          if (res.ok) {
            const data: ConnectorStatus = await res.json();
            statusEntries.push([c.id, data.status || "unknown"]);
          } else {
            statusEntries.push([c.id, "unknown"]);
          }
        } catch {
          statusEntries.push([c.id, "unknown"]);
        }
      })
    );
    setConnectorStatuses(Object.fromEntries(statusEntries));

    apiFetch(`/api/refresh-schedules?workspaceId=${workspaceId}`)
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          const first = Array.isArray(data) ? data[0] : data;
          if (first) {
            setRefreshConfig(first);
            if (first.cadence) setCadenceDraft(first.cadence);
          }
        }
      })
      .catch(() => {});

    apiFetch(`/api/preferences/digest/preview`)
      .then(async (r) => {
        if (r.ok) setDigestPreview(await r.json());
      })
      .catch(() => {});
  }, [workspaceId, workspace]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!digestToast) return;
    const t = setTimeout(() => setDigestToast(""), 2500);
    return () => clearTimeout(t);
  }, [digestToast]);

  async function saveWorkspace() {
    if (!workspaceId) return;
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/settings`, {
        method: "PUT",
        body: JSON.stringify({ name, productName: niche, niche }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(workspaceId, data);
      }
    } catch {}
  }

  async function uploadSample() {
    if (!voiceProfile || !sampleText.trim()) return;
    setUploading(true);
    try {
      const profileId =
        (voiceProfile as Record<string, unknown>).profileId ||
        (voiceProfile as Record<string, unknown>).id;
      await apiFetch(`/api/voice-profiles/${profileId}/upload-sample`, {
        method: "POST",
        body: JSON.stringify({ text: sampleText.trim() }),
      });
      setSampleText("");
      const r = await apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`);
      if (r.ok) setVoiceProfile(await r.json());
    } catch {
      setVoiceError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function activateCampaign(campaign: Campaign) {
    const id = campaign.campaignId || campaign.id;
    if (!id) return;
    try {
      await apiFetch(`/api/campaigns/${id}/activate`, { method: "POST" });
      await loadAll();
    } catch {}
  }

  async function pauseCampaign(campaign: Campaign) {
    const id = campaign.campaignId || campaign.id;
    if (!id) return;
    try {
      await apiFetch(`/api/campaigns/${id}/pause`, { method: "POST" });
      await loadAll();
    } catch {}
  }

  async function createCampaign() {
    if (!workspaceId || !newCampaignName.trim()) return;
    try {
      await apiFetch(`/api/campaigns`, {
        method: "POST",
        body: JSON.stringify({ workspaceId, name: newCampaignName.trim() }),
      });
      setNewCampaignName("");
      await loadAll();
    } catch {}
  }

  async function pickDigestDay(day: DigestDay) {
    setDigestDay(day);
    try {
      await apiFetch(`/api/preferences/digest-day`, {
        method: "PUT",
        body: JSON.stringify({ day }),
      });
    } catch {}
  }

  async function sendTestDigest() {
    setTestSending(true);
    try {
      const res = await apiFetch(`/api/preferences/digest/test`, { method: "POST" });
      setDigestToast(res.ok ? "Test digest queued" : "Test digest failed");
    } catch {
      setDigestToast("Test digest failed");
    } finally {
      setTestSending(false);
    }
  }

  async function saveRefreshCadence() {
    if (!workspaceId) return;
    try {
      await apiFetch(`/api/refresh-schedules`, {
        method: "POST",
        body: JSON.stringify({ workspaceId, cadence: cadenceDraft }),
      });
      await loadAll();
    } catch {}
  }

  if (!authenticated) return null;

  const hasActiveCampaign = campaigns.some((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>

      <Section id="workspace" title="Workspace">
        <div className="space-y-3">
          <Field label="Workspace name">
            <Input value={name} onChange={setName} />
          </Field>
          <Field label="Niche">
            <Input value={niche} onChange={setNiche} />
          </Field>
          <PrimaryButton onClick={saveWorkspace}>Save workspace</PrimaryButton>
        </div>
      </Section>

      {!isInvestor && (
        <Section id="voice" title="Voice">
          {voiceError ? (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {voiceError}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
                Status: {voiceProfile?.confidenceState || voiceProfile?.state || "SLIDERS_ONLY"}
                {voiceProfile?.version && ` · ${voiceProfile.version}`}
              </p>
              {voiceProfile?.samples && voiceProfile.samples.length > 0 && (
                <ul className="space-y-1">
                  {voiceProfile.samples.slice(0, 5).map((s, i) => (
                    <li
                      key={s.sampleId || s.id || i}
                      className="truncate rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-xs text-[--text-secondary]"
                    >
                      {s.title || (s.text ? s.text.slice(0, 80) : "Sample")}
                      {typeof s.wordCount === "number" && (
                        <span className="ml-2 font-mono text-[10px] text-[--text-muted]">
                          {s.wordCount}w
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                rows={4}
                placeholder="Paste writing sample — minimum 100 words"
                className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
              />
              <PrimaryButton onClick={uploadSample} disabled={uploading || !sampleText.trim()}>
                {uploading ? "Uploading…" : "Upload sample"}
              </PrimaryButton>
            </div>
          )}
        </Section>
      )}

      <Section id="campaigns" title="Campaigns">
        {campaigns.length === 0 ? (
          <p className="text-xs text-[--text-muted]">Create your first campaign to activate one.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c, i) => (
              <li
                key={c.campaignId || c.id || i}
                className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2"
              >
                <span className="flex-1 text-sm text-white">{c.name}</span>
                {c.goalType && (
                  <span className="font-mono text-[10px] uppercase text-[--text-muted]">
                    {c.goalType}
                  </span>
                )}
                {c.status === "ACTIVE" ? (
                  <>
                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 font-mono text-[9px] text-green-300">
                      ACTIVE
                    </span>
                    <MiniButton onClick={() => pauseCampaign(c)}>Pause</MiniButton>
                  </>
                ) : (
                  <MiniButton
                    onClick={() => activateCampaign(c)}
                    disabled={hasActiveCampaign}
                    title={hasActiveCampaign ? "Pause the active campaign first" : undefined}
                  >
                    Activate
                  </MiniButton>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={newCampaignName}
            onChange={setNewCampaignName}
            placeholder="New campaign name"
          />
          <PrimaryButton onClick={createCampaign} disabled={!newCampaignName.trim()}>
            Create
          </PrimaryButton>
        </div>
      </Section>

      <Section id="connectors" title="Connectors">
        <ul className="space-y-1">
          {CONNECTORS.map((c) => {
            const status = connectorStatuses[c.id] || "unknown";
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2"
              >
                <span className="flex-1 text-sm text-white">{c.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      status === "connected" ? "rgba(124,255,107,0.15)" : "rgba(255,255,255,0.05)",
                    color: status === "connected" ? "#7CFF6B" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {status}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-[--text-muted]">
          Coming from GummySearch? Importing Reddit signals is coming soon — your saved
          subs will flow in once the importer is live.
        </p>
      </Section>

      <Section id="digest" title="Weekly digest">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {DIGEST_DAYS.map((d) => {
              const active = digestDay === d;
              return (
                <button
                  key={d}
                  onClick={() => pickDigestDay(d)}
                  className="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "rgba(124, 255, 107, 0.15)" : "var(--bg-secondary)",
                    borderColor: active ? "#7CFF6B" : "var(--border)",
                    color: active ? "#7CFF6B" : "var(--text-secondary)",
                  }}
                >
                  {DAY_LABEL[d]}
                </button>
              );
            })}
          </div>
          {digestPreview && (
            <div className="rounded-md border border-[--border] bg-[--bg-panel] p-3 text-xs text-[--text-muted]">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider">Preview</p>
              <pre className="whitespace-pre-wrap break-all text-[10px]">
                {JSON.stringify(digestPreview, null, 2).slice(0, 400)}
              </pre>
            </div>
          )}
          <div className="flex items-center gap-3">
            <PrimaryButton onClick={sendTestDigest} disabled={testSending}>
              {testSending ? "Sending…" : "Send test digest"}
            </PrimaryButton>
            {digestToast && (
              <span className="text-[11px] text-[--text-secondary]">{digestToast}</span>
            )}
          </div>
        </div>
      </Section>

      <Section id="refresh" title="Scheduled refresh">
        <div className="space-y-3">
          <Field label="Cadence">
            <select
              value={cadenceDraft}
              onChange={(e) => setCadenceDraft(e.target.value)}
              className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="OFF">Off</option>
            </select>
          </Field>
          {refreshConfig?.nextRunAt && (
            <p className="font-mono text-[10px] text-[--text-muted]">
              Next run: {refreshConfig.nextRunAt}
            </p>
          )}
          <PrimaryButton onClick={saveRefreshCadence}>Save cadence</PrimaryButton>
        </div>
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      <h2 className="border-b border-[--border] pb-2 font-mono text-[10px] uppercase tracking-wider text-[--text-muted]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[--text-muted]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
    />
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function MiniButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded border border-[--border] bg-[--bg-panel] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[--text-secondary] hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}
