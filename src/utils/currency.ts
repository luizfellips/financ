export function formatCurrency(
  value: number,
  locale = "pt-BR",
  currency = "BRL",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(
  value: number,
  locale = "pt-BR",
  currency = "BRL",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // pt-BR: 1.234,56 → remove thousand dots, comma to decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Digits typed left-to-right as cents: "1" → 0.01, "15050" → 150.50 */
export function parseMoneyDigits(
  digits: string,
  options?: { negative?: boolean; maxDigits?: number },
): number {
  const maxDigits = options?.maxDigits ?? 15;
  const cleaned = digits.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits);
  if (!cleaned) return 0;

  const amount = Number.parseInt(cleaned, 10) / 100;
  if (!Number.isFinite(amount)) return 0;
  return options?.negative ? -amount : amount;
}

export function extractMoneyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  if (value && typeof value === "object" && "toString" in value) {
    return Number.parseFloat(String(value));
  }
  return 0;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
