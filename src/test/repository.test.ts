import { LocalRepository } from "../lib/repository/localRepository";
import { getRepository } from "../lib/repository/index";
import { isSupabaseConfigured } from "../lib/supabase/client";

export async function runRepositoryTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Capa de Repositorios (Fase 4B - Direx) ===");
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

  // 2. Crear y Obtener Clientes en Organización
  const customer = await repo.createCustomer(org.id, {
    name: "Cliente Test S.A.",
    email: "test@clientes.com",
    phone: "11-4455-6677",
    status: "active",
    totalSpent: 150000,
    totalPendingDebt: 50000
  });

  assert(customer.id.length > 0 && customer.organizationId === org.id, "LocalRepository crea cliente aislado por organizationId");

  const customersList = await repo.getCustomers(org.id);
  assert(customersList.some(c => c.id === customer.id), "LocalRepository recupera lista de clientes de la organización");

  // 3. Aislamiento Multi-Tenant: Org A no ve clientes de Org B
  const otherOrgId = "org-other-" + Date.now();
  const otherOrgCustomers = await repo.getCustomers(otherOrgId);
  assert(!otherOrgCustomers.some(c => c.id === customer.id), "Aislamiento: Organización B no puede leer clientes de Organización A");

  // 4. Modificar y Eliminar Cliente
  const updatedCustomer = await repo.updateCustomer(org.id, customer.id, { name: "Cliente Test Modificado" });
  assert(updatedCustomer.name === "Cliente Test Modificado", "LocalRepository actualiza cliente correctamente");

  const deleted = await repo.deleteCustomer(org.id, customer.id);
  assert(deleted === true, "LocalRepository elimina cliente");
  const postDeleteList = await repo.getCustomers(org.id);
  assert(!postDeleteList.some(c => c.id === customer.id), "Cliente eliminado no figura en consultas subsecuentes");

  // 5. Creación de Ventas y Productos
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

  // 6. Configuración segura de Supabase Client
  const defaultRepo = getRepository();
  assert(defaultRepo !== null, "getRepository() instancia el repositorio por defecto con fallback seguro");
  assert(typeof isSupabaseConfigured() === "boolean", "isSupabaseConfigured() devuelve boolean sin arrojar excepciones");

  console.log("\nResultado Repositorios: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
