import { LocalRepository } from "../../repository/localRepository";
import { safeRound } from "../../utils/formatters";

export async function runFinancialModulesTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas Financieras (Fase 4D.3 - Direx) ===");
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

  const repo = new LocalRepository();
  const org = await repo.createOrganization({
    name: "Empresa Financiera S.A.",
    taxId: "30-55667788-9",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Comercio",
    isDemo: false
  });

  // 1. Creacion atomica de Venta con lineas y calculo de totales
  const sale = await repo.createSale(org.id, {
    saleNumber: "FAC-A-0001-00000042",
    customerName: "Comercial Norte",
    date: "2026-08-26",
    subtotal: 0,
    discount: 500,
    tax: 0,
    total: 0,
    status: "confirmed",
    paymentStatus: "unpaid",
    items: [
      { productId: "prod-1", description: "Producto 1", quantity: 2, unitPrice: 1500, subtotal: 3000 },
      { productId: "prod-2", description: "Producto 2", quantity: 1, unitPrice: 2000, subtotal: 2000 }
    ]
  });

  assert(sale.subtotal === 5000, "Venta: subtotal de lineas calculado exactamente (5000)");
  assert(sale.total === 4500, "Venta: total con descuento aplicado exactamente (4500)");

  // 2. Comprobacion de que venta a credito genera cuenta por cobrar automaticamente
  const receivables = await repo.getReceivables(org.id);
  assert(receivables.some(r => r.saleId === sale.id && r.balance === 4500), "Venta impaga: genera Receivable con balance exacto");

  // 3. Paginacion y busqueda de Ventas
  const salesPaging = await repo.getSales(org.id, { page: 1, pageSize: 10 });
  assert(salesPaging.data.length === 1 && salesPaging.total === 1, "Paginacion de ventas devuelve total exacto");

  const salesSearch = await repo.getSales(org.id, { search: "00000042" });
  assert(salesSearch.data.length === 1, "Busqueda de ventas por numero de comprobante funciona");

  // 4. Modulo de Gastos con Paginacion
  const expense = await repo.createExpense(org.id, {
    category: "Servicios",
    amount: 12500.75,
    date: "2026-08-26",
    description: "Abono mensual internet fibra",
    supplierName: "Telecom S.A."
  });
  assert(expense.amount === 12500.75, "Gasto: importe NUMERIC exacto registrado");

  const expPaging = await repo.getExpenses(org.id, { page: 1, pageSize: 10 });
  assert(expPaging.data.some(e => e.id === expense.id), "Paginacion de gastos funciona");

  // 5. Modulo de Presupuestos / Cotizaciones con expiracion
  const quote = await repo.createQuote(org.id, {
    quoteNumber: "PRE-0001-00000088",
    customerName: "Cliente Proyecto X",
    total: 350000,
    validUntil: "2026-09-26",
    status: "draft",
    items: [
      { productId: "prod-x", description: "Instalacion Servidor", quantity: 1, unitPrice: 350000, subtotal: 350000 }
    ]
  });
  assert(quote.id.length > 0 && quote.status === "draft", "Presupuesto creado con estado draft");

  const quoteUpdated = await repo.updateQuoteStatus(org.id, quote.id, "sent");
  assert(quoteUpdated.status === "sent", "Estado de presupuesto actualizado a sent");

  // 6. Aislamiento Cross-Tenant Financiero
  const orgOther = await repo.createOrganization({
    name: "Empresa Externa",
    taxId: "30-00000000-0",
    currency: "ARS",
    currencySymbol: "$",
    industry: "General",
    isDemo: false
  });

  const otherSales = await repo.getSales(orgOther.id);
  const otherExpenses = await repo.getExpenses(orgOther.id);
  const otherQuotes = await repo.getQuotes(orgOther.id);

  assert(otherSales.data.length === 0, "Aislamiento Financiero: Org B no hereda ventas de Org A");
  assert(otherExpenses.data.length === 0, "Aislamiento Financiero: Org B no hereda gastos de Org A");
  assert(otherQuotes.data.length === 0, "Aislamiento Financiero: Org B no hereda presupuestos de Org A");

  console.log("\nResultado Modulos Financieros: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
