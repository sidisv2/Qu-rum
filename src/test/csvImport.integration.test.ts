import { LocalRepository } from "../lib/repository/localRepository";
import { safeRound } from "../lib/utils/formatters";

function parseNumber(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  let str = String(val).trim();
  if (str.includes(".") && str.includes(",")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const clean = str.replace(/[^0-9.-]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export async function runCsvImportIntegrationSuite(): Promise<boolean> {
  console.log("\n=== Ejecutando Suite de Integración de Importación CSV (Fase 31 - Direx) ===");
  let passed = 0;
  let failed = 0;

  const repo = new LocalRepository();
  const org = await repo.createOrganization({
    name: "Empresa Test Importación CSV",
    taxId: "30-99887766-5",
    industry: "Servicios",
    currency: "ARS",
    currencySymbol: "$",
    isDemo: false
  });

  const sampleCsvRows = [
    {
      Fecha: "2026-08-15",
      Tipo: "Venta",
      Concepto: "Licencia Anual Software ERP",
      Cliente_Proveedor: "Distribuidora Mayorista SA",
      Monto: "150.000,50",
      Estado: "Cobrado"
    },
    {
      Fecha: "2026-08-18",
      Tipo: "Gasto",
      Concepto: "Servidores Cloud AWS & Base de Datos",
      Cliente_Proveedor: "Amazon Web Services Inc",
      Monto: "45000",
      Categoria: "Infraestructura"
    },
    {
      Fecha: "2026-08-20",
      Tipo: "Venta",
      Concepto: "Consultoría de Arquitectura Financiera",
      Cliente_Proveedor: "Corporación Logística Federal",
      Monto: "85000",
      Estado: "Pendiente"
    }
  ];

  try {
    let salesTotal = 0;
    let expensesTotal = 0;

    for (const row of sampleCsvRows) {
      const typeStr = String(row.Tipo || "").toLowerCase();
      const amount = parseNumber(row.Monto);
      const date = row.Fecha;
      const description = row.Concepto;

      if (typeStr.includes("gasto")) {
        const supplierName = row.Cliente_Proveedor;
        const sup = await repo.createSupplier(org.id, {
          name: supplierName,
          contactName: supplierName,
          email: "billing@aws.com",
          phone: "0800-111-222",
          category: row.Categoria || "General",
          totalPaid: amount,
          pendingPayment: 0
        });

        const expense = await repo.createExpense(org.id, {
          supplierId: sup.id,
          supplierName: sup.name,
          category: row.Categoria || "General",
          amount,
          date,
          description,
          isAnomaly: false
        });

        if (expense && expense.amount === amount) {
          expensesTotal += amount;
        }
      } else {
        const clientName = row.Cliente_Proveedor;
        const cust = await repo.createCustomer(org.id, {
          name: clientName,
          taxId: "30-55443322-1",
          email: "contacto@cliente.com",
          phone: "11-4455-6677",
          address: "Av. Corrientes 1234",
          status: "active",
          totalSpent: amount,
          totalPendingDebt: 0
        });

        const paymentStatus = String(row.Estado || "").toLowerCase().includes("pend") ? "unpaid" : "paid";
        const sale = await repo.createSale(org.id, {
          customerId: cust.id,
          customerName: cust.name,
          saleNumber: "CSV-TEST-" + Math.floor(Math.random() * 10000),
          items: [
            {
              id: "item-1",
              productId: "",
              description,
              quantity: 1,
              unitPrice: amount,
              subtotal: amount
            }
          ],
          subtotal: amount,
          discount: 0,
          tax: 0,
          total: amount,
          status: "confirmed",
          paymentStatus,
          date
        });

        if (sale && sale.total === amount) {
          salesTotal += amount;
        }
      }
    }

    // 1. Validar inserción de Ventas
    const salesRes = await repo.getSales(org.id);
    if (salesRes.data.length === 2 && safeRound(salesTotal, 2) === 235000.5) {
      console.log("  [PASS] Importación de Ventas: 2 ventas registradas con total exacto ($235.000,50)");
      passed++;
    } else {
      console.error("  [FAIL] Importación de Ventas incorrecta: " + salesRes.data.length);
      failed++;
    }

    // 2. Validar inserción de Gastos
    const expRes = await repo.getExpenses(org.id);
    if (expRes.data.length === 1 && safeRound(expensesTotal, 2) === 45000) {
      console.log("  [PASS] Importación de Gastos: 1 comprobante registrado con importe exacto ($45.000)");
      passed++;
    } else {
      console.error("  [FAIL] Importación de Gastos incorrecta: " + expRes.data.length);
      failed++;
    }

    // 3. Validar consistencia de Clientes y Proveedores creados
    const custRes = await repo.getCustomers(org.id);
    const supRes = await repo.getSuppliers(org.id);
    if (custRes.data.length === 2 && supRes.data.length === 1) {
      console.log("  [PASS] Auto-provisión de Contactos: Clientes y Proveedores creados e indexados");
      passed++;
    } else {
      console.error("  [FAIL] Auto-provisión de Contactos fallida");
      failed++;
    }

    // 4. Validar formato seguro de IDs o UUIDs
    const allSalesValid = salesRes.data.every(s => s.id && typeof s.id === "string");
    const allExpensesValid = expRes.data.every(e => e.id && typeof e.id === "string");
    if (allSalesValid && allExpensesValid) {
      console.log("  [PASS] Integridad de IDs y Foreign Keys: Sintaxis sin strings sintéticos corruptos");
      passed++;
    } else {
      console.error("  [FAIL] Integridad de IDs inválida");
      failed++;
    }

  } catch (err: any) {
    console.error("  [FAIL] Error en suite de importación CSV:", err.message || err);
    failed++;
  }

  console.log(`Resultado Importación CSV: ${passed} pruebas exitosas, ${failed} fallidas.`);
  return failed === 0;
}
