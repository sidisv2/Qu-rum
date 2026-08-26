import { LocalRepository } from "../lib/repository/localRepository";
import { getRepository } from "../lib/repository/index";
import { isSupabaseConfigured } from "../lib/supabase/client";

export async function runRepositoryTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Capa de Repositorios (Fase 4D.2 - Direx) ===");
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
  const orgId = "org-test-" + Date.now();

  // 1. Crear Organización
  const org = await repo.createOrganization({
    name: "Empresa de Prueba Repo",
    taxId: "30-71999888-9",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Servicios",
    isDemo: false
  });
  assert(org.id.length > 0, "LocalRepository crea organización correctamente");

  // 2. Crear y Obtener Clientes con Paginación
  const customer = await repo.createCustomer(org.id, {
    name: "Cliente Test S.A.",
    email: "test@clientes.com",
    phone: "11-4455-6677",
    status: "active",
    totalSpent: 150000,
    totalPendingDebt: 50000
  });

  assert(customer.id.length > 0 && customer.organizationId === org.id, "LocalRepository crea cliente aislado por organizationId");

  const customersRes = await repo.getCustomers(org.id, { page: 1, pageSize: 10 });
  assert(customersRes.data.some(c => c.id === customer.id), "LocalRepository recupera lista paginada de clientes");
  assert(customersRes.total >= 1, "Paginación: total de clientes calculado correctamente");

  // 3. Búsqueda de Clientes
  const searchRes = await repo.getCustomers(org.id, { search: "Test S.A." });
  assert(searchRes.data.length === 1 && searchRes.data[0].id === customer.id, "Búsqueda: filtra cliente por coincidencia en nombre");

  // 4. Aislamiento Multi-Tenant: Org A no ve clientes de Org B
  const otherOrgId = "org-other-" + Date.now();
  const otherOrgCustomers = await repo.getCustomers(otherOrgId);
  assert(!otherOrgCustomers.data.some(c => c.id === customer.id), "Aislamiento: Organización B no puede leer clientes de Organización A");

  // 5. Modificar y Eliminar Cliente
  const updatedCustomer = await repo.updateCustomer(org.id, customer.id, { name: "Cliente Test Modificado" });
  assert(updatedCustomer.name === "Cliente Test Modificado", "LocalRepository actualiza cliente correctamente");

  const deleted = await repo.deleteCustomer(org.id, customer.id);
  assert(deleted === true, "LocalRepository elimina cliente");
  const postDeleteRes = await repo.getCustomers(org.id);
  assert(!postDeleteRes.data.some(c => c.id === customer.id), "Cliente eliminado no figura en consultas subsecuentes");

  // 6. Creación de Proveedores con Paginación
  const supplier = await repo.createSupplier(org.id, {
    name: "Distribuidora Industrial S.A.",
    contactName: "Juan Pérez",
    category: "Insumos",
    email: "ventas@distribuidora.com",
    phone: "11-3322-1100",
    totalPaid: 450000,
    pendingPayment: 85000
  });
  assert(supplier.id.length > 0, "LocalRepository crea proveedor");
  const suppliersRes = await repo.getSuppliers(org.id, { page: 1, pageSize: 10 });
  assert(suppliersRes.data.some(s => s.id === supplier.id), "LocalRepository recupera lista paginada de proveedores");

  // 7. Creación de Productos con Paginación
  const prod = await repo.createProduct(org.id, {
    name: "Servicio Premium",
    sku: "SERV-001",
    category: "Servicios",
    cost: 5000,
    price: 15000,
    marginAmount: 10000,
    marginPercent: 66.7,
    status: "active"
  });
  assert(prod.price === 15000 && prod.cost === 5000, "LocalRepository crea producto con montos numéricos precisos");
  const prodsRes = await repo.getProducts(org.id, { page: 1, pageSize: 10 });
  assert(prodsRes.data.some(p => p.id === prod.id), "LocalRepository recupera lista paginada de productos");

  // 8. Configuración segura de Supabase Client
  const defaultRepo = getRepository();
  assert(defaultRepo !== null, "getRepository() instancia el repositorio por defecto con fallback seguro");
  assert(typeof isSupabaseConfigured() === "boolean", "isSupabaseConfigured() devuelve boolean sin arrojar excepciones");

  console.log("\nResultado Repositorios: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
