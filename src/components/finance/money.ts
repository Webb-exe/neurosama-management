export function formatCents(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || Number.isNaN(cents)) {
    return "—";
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = dollars.toLocaleString("en-US");
  return `${sign}$${formatted}.${remainder.toString().padStart(2, "0")}`;
}

// Parse a dollars string ("12.34", "12", "$1,234.5") into integer cents.
// Returns null when the input cannot be parsed cleanly.
export function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[$,\s]/g, "");
  if (!trimmed) return null;
  if (!/^-?\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole, fractional = ""] = unsigned.split(".");
  const wholeCents = Number(whole) * 100;
  const fractionalCents = Number((fractional + "00").slice(0, 2));
  if (Number.isNaN(wholeCents) || Number.isNaN(fractionalCents)) return null;
  const total = wholeCents + fractionalCents;
  return negative ? -total : total;
}

export function centsToDollarsInput(cents: number | undefined | null): string {
  if (cents === undefined || cents === null) return "";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars}.${remainder.toString().padStart(2, "0")}`;
}
