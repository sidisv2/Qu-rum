import { InsightEngine } from "../lib/intelligence/insightEngine";
import { DirectorAIService } from "../lib/intelligence/directorAIService";
import { getInitialDemoState } from "../lib/demo/initialData";

export async function runIntelligenceTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Inteligencia Determinística (Fase 3 - Direx) ===");
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

  const demoDataOrgA = getInitialDemoState("org-a");

  // 1. Análisis determinístico
  const analyticsA = InsightEngine.analyze({
    organizationId: "org-a",
    customers: demoDataOrgA.customers,
    products: demoDataOrgA.products,
    sales: demoDataOrgA.sales,
    expenses: demoDataOrgA.expenses,
    receivables: demoDataOrgA.receivables,
    payables: demoDataOrgA.payables,
    quotes: demoDataOrgA.quotes
  });

  assert(analyticsA.salesMetrics.totalSales > 0, "InsightEngine calcula ventas totales exactas sin alucinaciones");
  assert(analyticsA.receivablesMetrics.overdueCount > 0, "InsightEngine detecta exactamente cuentas en mora vencida");
  assert(analyticsA.insights.length >= 3, "InsightEngine genera insights estructurados con evidencia");

  // 2. Comprobación de evidencia estructurada
  const overdueInsight = analyticsA.insights.find(i => i.type === "risk" && i.relatedEntity.type === "receivable");
  assert(overdueInsight !== undefined, "InsightEngine genera insight de mora con entidad vinculada");
  assert(overdueInsight ? overdueInsight.evidence.length >= 2 : false, "Insight cuenta con al menos 2 piezas de evidencia técnica");

  // 3. Director IA determinístico sin invención
  const aiResponse = await DirectorAIService.answerExecutiveQuery({
    question: "¿Cómo está mi negocio hoy?",
    orgData: {
      organizationId: "org-a",
      customers: demoDataOrgA.customers,
      products: demoDataOrgA.products,
      sales: demoDataOrgA.sales,
      expenses: demoDataOrgA.expenses,
      receivables: demoDataOrgA.receivables,
      payables: demoDataOrgA.payables,
      quotes: demoDataOrgA.quotes
    },
    organizationName: "Distribuidora Andina"
  });

  assert(aiResponse.answer.includes("Distribuidora Andina"), "Director IA responde con el contexto de la empresa activa");
  assert(aiResponse.answer.includes("Ventas Consolidadas"), "Director IA estructura la respuesta de forma ejecutiva");
  assert(aiResponse.structuredInsights !== undefined && aiResponse.structuredInsights.length > 0, "Director IA entrega insights estructurados con evidencia");

  // 4. Aislamiento Multi-Tenant (Org A vs Org B)
  const emptyOrgB = {
    organizationId: "org-b",
    customers: [],
    products: [],
    sales: [],
    expenses: [],
    receivables: [],
    payables: [],
    quotes: []
  };

  const analyticsB = InsightEngine.analyze(emptyOrgB);
  assert(analyticsB.salesMetrics.totalSales === 0, "Aislamiento: Org B vacía no hereda ventas de Org A");
  assert(analyticsB.receivablesMetrics.overdueCount === 0, "Aislamiento: Org B vacía no hereda deudas de Org A");
  assert(analyticsB.insights.length === 0, "Aislamiento: Org B no genera insights falsos sobre datos ajenos");

  console.log("\nResultado Inteligencia: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
