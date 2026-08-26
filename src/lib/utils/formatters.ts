export function safeRound(amount: number, decimals: number = 2): number {
  if (isNaN(amount) || amount === null || amount === undefined || !isFinite(amount)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function formatCurrency(amount: number, _currency: string = "ARS", symbol: string = "$"): string {
  const rounded = safeRound(amount, 2);
  const formatted = Math.abs(rounded).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return rounded < 0 ? "-" + symbol + " " + formatted : symbol + " " + formatted;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const parts = dateString.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
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

export function calculateDaysDifference(targetDateString: string): number {
  if (!targetDateString) return 0;
  const parts = targetDateString.split("T")[0].split("-");
  if (parts.length !== 3) return 0;
  
  const targetYear = parseInt(parts[0], 10);
  const targetMonth = parseInt(parts[1], 10) - 1;
  const targetDay = parseInt(parts[2], 10);
  
  const target = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatRelativeDays(dateString: string): string {
  if (!dateString) return "-";
  const diffDays = calculateDaysDifference(dateString);

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays < 0) return "Venció hace " + Math.abs(diffDays) + " días";
  return "Vence en " + diffDays + " días";
}

export function calculateMargin(price: number, cost: number): { amount: number; percent: number } {
  const p = safeRound(Number(price) || 0, 2);
  const c = safeRound(Number(cost) || 0, 2);
  const amount = safeRound(p - c, 2);
  const percent = p > 0 ? safeRound(((p - c) / p) * 100, 1) : 0;
  return {
    amount,
    percent
  };
}

export function sanitizeCsvField(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}
