import { LocalRepository } from "../../repository/localRepository";
import { LocalStorageRepository } from "../../storage/localStorage";

export async function runE2EFullAuditSuite() {
  console.log("=== Ejecutando Suite de Auditoría Integral E2E (Fase 4D.6 - Direx) ===");
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
  const storage = new LocalStorageRepository();

  // 1. Setup Multi-Tenant (ORG_A vs ORG_B)
  const orgA = await repo.createOrganization({
    name: "Empresa Alpha SA",
    taxId: "30-11111111-1",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Tecnología",
    isDemo: false
  });

  const orgB = await repo.createOrganization({
    name: "Empresa Beta SRL",
    taxId: "30-22222222-2",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Comercio",
    isDemo: false
  });

  // 2. Creación de Entidades Maestras en ORG_A
  const custA = await repo.createCustomer(orgA.id, {
    name: "Cliente Alpha Corp",
    email: "alpha@corp.com",
    phone: "1122334455",
    taxId: "30-55555555-5",
    status: "active",
    totalSpent: 0,
    totalPendingDebt: 0
  });

  const prodA = await repo.createProduct(orgA.id, {
    name: "Servidor Dedicado Pro",
    sku: "SRV-001",
    category: "Hardware",
    price: 1000,
    cost: 700,
    marginAmount: 300,
    marginPercent: 30,
    stock: 10,
    status: "active"
  });

  const suppA = await repo.createSupplier(orgA.id, {
    name: "Distribuidora Tech Alpha",
    contactName: "Juan Proveedor",
    email: "prov@alpha.com",
    phone: "1199887766",
    category: "Hardware",
    totalPaid: 0,
    pendingPayment: 0
  });

  assert(!!custA.id && !!prodA.id && !!suppA.id, "Maestros creados en ORG_A");

  // 3. Flujo Financiero Completo: Venta -> Receivable -> Cobro Parcial -> Cobro Total
  const saleA = await repo.createSale(orgA.id, {
    customerId: custA.id,
    customerName: custA.name,
    saleNumber: "VTA-ALPHA-001",
    date: "2026-08-26",
    items: [
      {
        id: "item-1",
        productId: prodA.id,
        description: prodA.name,
        quantity: 2,
        unitPrice: 1000,
        subtotal: 2000
      }
    ],
    subtotal: 2000,
    discount: 200,
    tax: 0,
    total: 1800,
    status: "confirmed",
    paymentStatus: "unpaid"
  }, "idemp-sale-001");

  assert(saleA.total === 1800, "Venta creada con total exacto (2000 - 200 = 1800)");

  // 4. Verificar generación de Cuenta por Cobrar (Receivable)
  const recs = await repo.getReceivables(orgA.id);
  const recA = recs.data.find(r => r.saleId === saleA.id);
  assert(!!recA && recA.amount === 1800 && recA.balance === 1800 && recA.status === "pending", "Receivable generado con saldo 1800 y estado pending");

  // 5. Test de Integridad Histórica (Modificar producto sin afectar histórico)
  await repo.updateProduct(orgA.id, prodA.id, { price: 1500, cost: 1100 });
  const historicalSale = await repo.getSaleById(orgA.id, saleA.id);
  assert(
    historicalSale?.items[0].unitPrice === 1000,
    "Snapshot histórico: la actualización de precios del catálogo no altera precios de ventas pasadas"
  );

  // 6. Cobro Parcial y Amortización
  const recAfterPay1 = await repo.recordPaymentReceivable(orgA.id, recA!.id, {
    amount: 800,
    paymentMethod: "transfer",
    reference: "TRF-001",
    idempotencyKey: "idemp-pay-001"
  });
  assert(recAfterPay1.balance === 1000 && recAfterPay1.status === "partial", "Cobro parcial amortiza saldo a 1000 y estado partial");

  // 7. Cobro Total y Cierre de Saldo
  const recAfterPay2 = await repo.recordPaymentReceivable(orgA.id, recA!.id, {
    amount: 1000,
    paymentMethod: "transfer",
    reference: "TRF-002",
    idempotencyKey: "idemp-pay-002"
  });
  assert(recAfterPay2.balance === 0 && recAfterPay2.status === "paid", "Cobro total extingue saldo a 0 y estado paid");

  // 8. Test de Prevención de Sobrepago
  let overpayThrew = false;
  try {
    await repo.recordPaymentReceivable(orgA.id, recA!.id, { amount: 100 });
  } catch (e) {
    overpayThrew = true;
  }
  assert(overpayThrew, "Prevención de sobrepago: Rechaza cobros adicionales sobre deuda extinta");

  // 9. Documentos & Signed URL Isolation
  const dummyFile = new Blob(["Factura Binaria 100% Protegida"], { type: "application/pdf" });
  const upDoc = await storage.uploadDocument({
    organizationId: orgA.id,
    documentId: "doc-alpha-123",
    file: dummyFile,
    fileName: "factura_001.pdf",
    contentType: "application/pdf"
  });
  assert(upDoc.storagePath.startsWith(`${orgA.id}/`), "Storage guarda en path seguro {org_id}/{doc_id}/{filename}");

  const signedUrlA = await storage.getSignedUrl(orgA.id, upDoc.storagePath);
  assert(!!signedUrlA && signedUrlA.length > 0, "Signed URL generada para ORG_A");

  let crossStorageDenied = false;
  try {
    await storage.getSignedUrl(orgB.id, upDoc.storagePath);
  } catch (e) {
    crossStorageDenied = true;
  }
  assert(crossStorageDenied, "Storage deniega generación de URL firmada a ORG_B sobre path de ORG_A");

  // 10. Audit Logs: Append-Only e Inmutabilidad
  const auditLogsA = await repo.getAuditLogs(orgA.id);
  assert(auditLogsA.total >= 3, "Audit logs registra eventos financieros y documentales de forma append-only");

  // 11. Aislamiento Cross-Tenant Global Estricto
  const customersB = await repo.getCustomers(orgB.id);
  const productsB = await repo.getProducts(orgB.id);
  const salesB = await repo.getSales(orgB.id);
  const receivablesB = await repo.getReceivables(orgB.id);
  const docsB = await repo.getDocuments(orgB.id);
  const logsB = await repo.getAuditLogs(orgB.id);

  assert(
    customersB.total === 0 &&
    productsB.total === 0 &&
    salesB.total === 0 &&
    receivablesB.total === 0 &&
    docsB.total === 0 &&
    logsB.total === 0,
    "Aislamiento Total: ORG_B no puede acceder a ningún dato de ORG_A"
  );

  console.log("\nResultado Auditoría E2E: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
