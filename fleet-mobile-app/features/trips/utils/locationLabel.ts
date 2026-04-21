const COUNTRY_LABELS = new Set(["tunisia", "tunisie"]);

function normalizePart(part: string): string {
  return part.trim().replace(/\s+/g, " ");
}

export function extractPostalCode(value: string): string | null {
  const match = value.match(/\b(\d{4,6})\b/);
  return match?.[1] ?? null;
}

export function formatLocationLabel(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const postalCode = extractPostalCode(raw);
  if (!postalCode) return raw;

  const parts = raw
    .split(",")
    .map(normalizePart)
    .filter(Boolean)
    .filter((part) => !COUNTRY_LABELS.has(part.toLowerCase()));

  const postcodeIndex = parts.findIndex((part) => part.includes(postalCode));
  if (postcodeIndex <= 0) return raw;

  for (let index = postcodeIndex - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (!candidate) continue;
    if (candidate.includes(postalCode)) continue;
    if (/^\d+$/.test(candidate)) continue;
    return `${candidate}, ${postalCode}`;
  }

  return raw;
}
