export function formatCurrency(amount: number, currency: string = "ARS", symbol: string = "$"): string {
  if (isNaN(amount) || amount === null || amount === undefined) return symbol + " 0";
  const formatted = Math.abs(amount).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return amount < 0 ? "-" + symbol + " " + formatted : symbol + " " + formatted;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeDays(dateString: string): string {
  if (!dateString) return "-";
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays < 0) return "Venció hace " + Math.abs(diffDays) + " días";
  return "Vence en " + diffDays + " días";
}

export function calculateMargin(price: number, cost: number): { amount: number; percent: number } {
  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  const amount = p - c;
  const percent = p > 0 ? ((p - c) / p) * 100 : 0;
  return {
    amount: Math.round(amount * 100) / 100,
    percent: Math.round(percent * 10) / 10
  };
}
