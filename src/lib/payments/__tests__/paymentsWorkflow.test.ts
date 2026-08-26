import { LocalRepository } from "../../repository/localRepository";
import { safeRound } from "../../utils/formatters";

export async function runPaymentsTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Cuentas por Cobrar, Pagar y Pagos (Fase 4D.4 - Direx) ===");
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
    name: "Empresa Pagos S.A.",
    taxId: "30-11223344-5",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Servicios",
    isDemo: false
  });

  // 1. Creación de venta que genera automáticamente una cuenta por cobrar
  const sale = await repo.createSale(org.id, {
    customerId: "cust-4d4",
    customerName: "Cliente Amortizaciones S.A.",
    saleNumber: "FAC-B-0001-00000099",
    date: "2026-08-26",
    subtotal: 10000,
    discount: 0,
    tax: 0,
    total: 10000,
    status: "confirmed",
    paymentStatus: "unpaid",
    items: [
      { id: "it-1", productId: "prod-1", description: "Servicio Cloud Anual", quantity: 1, unitPrice: 10000, subtotal: 10000 }
    ]
  });

  const recResult = await repo.getReceivables(org.id);
  const rec = recResult.data.find(r => r.saleId === sale.id);
  assert(!!rec && rec.balance === 10000 && rec.status === "pending", "Cuenta por cobrar inicial creada con saldo 10000 y estado pending");

  // 2. Primer pago parcial (Amortización)
  const recPartial1 = await repo.recordPaymentReceivable(org.id, rec!.id, {
    amount: 4000,
    paymentMethod: "Transferencia",
    reference: "TRF-001",
    notes: "Primer adelanto 40%"
  });
  assert(recPartial1.balance === 6000 && recPartial1.status === "partial", "Primer pago parcial: saldo 6000 y estado partial");

  // 3. Segundo pago parcial
  const recPartial2 = await repo.recordPaymentReceivable(org.id, rec!.id, {
    amount: 3000,
    paymentMethod: "Cheque",
    reference: "CHQ-1002"
  });
  assert(recPartial2.balance === 3000 && recPartial2.status === "partial", "Segundo pago parcial: saldo 3000 y estado partial");

  // 4. Pago final (Cancelación total de deuda)
  const recFinal = await repo.recordPaymentReceivable(org.id, rec!.id, {
    amount: 3000,
    paymentMethod: "Efectivo"
  });
  assert(recFinal.balance === 0 && recFinal.status === "paid", "Pago final: saldo 0 y estado paid");

  // 5. Historial inmutable de pagos
  const paymentsHistory = await repo.getReceivablePayments(org.id, rec!.id);
  assert(paymentsHistory.length === 3, "Historial de pagos conserva 3 comprobantes inmutables");
  assert(paymentsHistory[0].amount === 3000 && paymentsHistory[2].amount === 4000, "Historial de pagos ordenado cronológicamente con montos exactos");

  // 6. Validación de rechazo de sobrepago
  let overpayThrew = false;
  try {
    await repo.recordPaymentReceivable(org.id, rec!.id, { amount: 500 });
  } catch (e) {
    overpayThrew = true;
  }
  assert(overpayThrew, "Rechazo de sobrepago sobre cuenta saldada");

  // 7. Validación de monto negativo y cero rechazados
  let invalidAmountThrew = false;
  const payablesBefore = await repo.getPayables(org.id);
  let payable = payablesBefore.data[0];
  if (!payable) {
    const state = (repo as any).getState(org.id);
    payable = {
      id: "pay-test-1",
      organizationId: org.id,
      supplierId: "sup-test",
      supplierName: "Estudio Jurídico & Asoc.",
      amount: 15000,
      balance: 15000,
      dueDate: "2026-09-30",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    state.payables = [payable, ...state.payables];
    (repo as any).saveState(state);
  }

  try {
    await repo.recordPaymentPayable(org.id, payable.id, { amount: -100 });
  } catch (e) {
    invalidAmountThrew = true;
  }
  assert(invalidAmountThrew, "Rechazo de pago con monto negativo a proveedor");

  // 8. Pago parcial a proveedor
  const payUpdated = await repo.recordPaymentPayable(org.id, payable.id, {
    amount: 5000,
    paymentMethod: "Transferencia",
    reference: "TRF-SUP-01"
  });
  assert(payUpdated.balance === 10000 && payUpdated.status === "partial", "Pago a proveedor amortizado a 10000 con estado partial");

  // 9. Aislamiento Cross-Tenant de Cobros y Pagos
  const orgB = await repo.createOrganization({
    name: "Empresa B S.A.",
    taxId: "30-99887766-5",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Comercio",
    isDemo: false
  });

  const recB = await repo.getReceivables(orgB.id);
  const payB = await repo.getPayables(orgB.id);
  assert(recB.data.length === 0, "Aislamiento: Org B no ve cuentas por cobrar de Org A");
  assert(payB.data.length === 0, "Aislamiento: Org B no ve cuentas por pagar de Org A");

  console.log("\nResultado Pagos y Amortizaciones: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
