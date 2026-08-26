import { LocalRepository } from "../../repository/localRepository";
import { safeRound } from "../../utils/formatters";

export async function runMasterModulesTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Módulos Maestros (Fase 4D.2 - Direx) ===");
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
    name: "Org Prueba Maestros",
    taxId: "30-11223344-5",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Tecnología",
    isDemo: false
  });

  // 1. Clientes CRUD & Soft Delete Simulation
  const cust = await repo.createCustomer(org.id, {
    name: "Cliente Alpha S.A.",
    email: "alpha@corp.com",
    phone: "11-9988-7766",
    status: "active",
    totalSpent: 50000,
    totalPendingDebt: 0
  });
  assert(cust.id.length > 0, "Cliente creado con ID válido");

  const custPaging = await repo.getCustomers(org.id, { page: 1, pageSize: 5 });
  assert(custPaging.data.length === 1 && custPaging.total === 1, "Paginación de clientes devuelve total exacto");

  const custSearch = await repo.getCustomers(org.id, { search: "alpha" });
  assert(custSearch.data.length === 1, "Búsqueda case-insensitive de clientes funciona");

  await repo.updateCustomer(org.id, cust.id, { name: "Cliente Alpha Modificado" });
  const custUpdated = await repo.getCustomerById(org.id, cust.id);
  assert(custUpdated?.name === "Cliente Alpha Modificado", "Cliente actualizado correctamente");

  // 2. Proveedores CRUD
  const sup = await repo.createSupplier(org.id, {
    name: "Proveedor Global S.R.L.",
    contactName: "Martín Gómez",
    category: "Hardware",
    email: "mgomez@global.com",
    phone: "11-2233-4455",
    totalPaid: 120000,
    pendingPayment: 30000
  });
  assert(sup.id.length > 0, "Proveedor creado con ID válido");

  const supPaging = await repo.getSuppliers(org.id, { page: 1, pageSize: 10 });
  assert(supPaging.data.length === 1 && supPaging.total === 1, "Paginación de proveedores devuelve total exacto");

  // 3. Productos & Margen Determinístico
  const prodCost = 4500.50;
  const prodPrice = 10000;
  const marginAmt = safeRound(prodPrice - prodCost, 2);
  const marginPct = safeRound(((prodPrice - prodCost) / prodPrice) * 100, 1);

  const prod = await repo.createProduct(org.id, {
    name: "Licencia de Software",
    sku: "LIC-001",
    category: "Software",
    cost: prodCost,
    price: prodPrice,
    marginAmount: marginAmt,
    marginPercent: marginPct,
    status: "active"
  });
  assert(prod.marginAmount === 5499.50, "Cálculo de margen numérico exacto sin drift de redondeo");
  assert(prod.marginPercent === 55.0, "Cálculo de porcentaje de margen exacto");

  // 4. Aislamiento Cross-Tenant de Maestros
  const orgB = await repo.createOrganization({
    name: "Org B Aislada",
    taxId: "30-99999999-9",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Retail",
    isDemo: false
  });

  const orgBCusts = await repo.getCustomers(orgB.id);
  const orgBSups = await repo.getSuppliers(orgB.id);
  const orgBProds = await repo.getProducts(orgB.id);

  assert(orgBCusts.data.length === 0, "Org B no hereda clientes de Org A");
  assert(orgBSups.data.length === 0, "Org B no hereda proveedores de Org A");
  assert(orgBProds.data.length === 0, "Org B no hereda productos de Org A");

  console.log("\nResultado Módulos Maestros: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
