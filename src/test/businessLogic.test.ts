import { calculateMargin, safeRound, calculateDaysDifference, sanitizeCsvField } from "../lib/utils/formatters";
import { InternalBusinessTools } from "../lib/ai/businessTools";
import { getInitialDemoState } from "../lib/demo/initialData";

export function runValidationSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Hardening (Direx) ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log("  [PASS] " + testName);
      passed++;
    } else {
      console.error("  [FAIL] " + testName);
      failed++;
    }
  }

  // 1. Margen & Floating point
  const normalMargin = calculateMargin(100, 60);
  assert(normalMargin.amount === 40 && normalMargin.percent === 40, "calculateMargin calcula margen estándar correctamente");

  const zeroPrice = calculateMargin(0, 50);
  assert(zeroPrice.amount === -50 && zeroPrice.percent === 0, "calculateMargin maneja precio 0 sin NaN");

  const sum = 0.1 + 0.2;
  assert(safeRound(sum, 2) === 0.3, "safeRound previene errores de precisión decimal (0.1 + 0.2 = 0.3)");

  // 2. Sanitización CSV
  assert(sanitizeCsvField("=SUM(A1:A10)") === "'=SUM(A1:A10)", "sanitizeCsvField neutraliza inyección de fórmulas =");
  assert(sanitizeCsvField("@cmd") === "'@cmd", "sanitizeCsvField neutraliza inyección de fórmulas @");
  assert(sanitizeCsvField("Cliente Normal") === "Cliente Normal", "sanitizeCsvField preserva texto legítimo");

  // 3. Timezone y fechas
  const todayStr = new Date().toISOString().split("T")[0];
  assert(calculateDaysDifference(todayStr) === 0, "calculateDaysDifference calcula 0 días para la fecha actual (sin drift de timezone)");

  // 4. Aislamiento de IA y métricas consolidadas
  const demoOrgA = getInitialDemoState("org-a");
  const summaryA = InternalBusinessTools.generateConsolidatedSummary({
    sales: demoOrgA.sales,
    expenses: demoOrgA.expenses,
    receivables: demoOrgA.receivables,
    payables: demoOrgA.payables,
    quotes: demoOrgA.quotes,
    customers: demoOrgA.customers,
    products: demoOrgA.products
  });

  assert(summaryA.totalSales > 0 && summaryA.totalExpenses > 0, "InternalBusinessTools procesa métricas consolidadas reales");
  assert(summaryA.overdueReceivablesTotal === 180000, "InternalBusinessTools identifica exactamente las deudas vencidas");

  console.log("\nResultado: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
