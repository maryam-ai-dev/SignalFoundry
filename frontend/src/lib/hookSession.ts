const ARCHIVE_PREFIX = "sf_archived_hooks_";
const SHIPPED_PREFIX = "sf_shipped_hooks_";

function key(prefix: string, topic: string | null | undefined) {
  const t = (topic || "default").slice(0, 80);
  return prefix + encodeURIComponent(t);
}

function read(prefix: string, topic: string | null | undefined): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(prefix, topic));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function write(prefix: string, topic: string | null | undefined, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(prefix, topic), JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore
  }
}

export function readArchivedHooks(topic: string | null | undefined): string[] {
  return read(ARCHIVE_PREFIX, topic);
}

export function addArchivedHook(topic: string | null | undefined, id: string) {
  const current = readArchivedHooks(topic);
  if (!current.includes(id)) write(ARCHIVE_PREFIX, topic, [...current, id]);
}

export function readShippedHooks(topic: string | null | undefined): string[] {
  return read(SHIPPED_PREFIX, topic);
}

export function addShippedHook(topic: string | null | undefined, id: string) {
  const current = readShippedHooks(topic);
  if (!current.includes(id)) write(SHIPPED_PREFIX, topic, [...current, id]);
}
