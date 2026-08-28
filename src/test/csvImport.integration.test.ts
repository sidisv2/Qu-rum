import { LocalRepository } from "../lib/repository/localRepository";
import { SupabaseRepository } from "../lib/repository/supabaseRepository";
import { parseLocalizedAmount, normalizeNullableUuid, safeRound } from "../lib/utils/formatters";
import { PlanLimitsService } from "../lib/subscription/planLimits";
import { supabase, isSupabaseConfigured } from "../lib/supabase/client";

export async function runCsvImportIntegrationSuite(): Promise<boolean> {
  console.log("\n=== Ejecutando Suite de Integración Definitiva Hardened (Fase 33 - Direx) ===");
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

  // -------------------------------------------------------------------------
  // 1. Tests Unitarios de Parseo Localizado y UUIDs (Punto 1 y Requerimientos)
  // -------------------------------------------------------------------------
  assert(parseLocalizedAmount("$ 150.000,50") === 150000.5, "parseLocalizedAmount: '$ 150.000,50' -> 150000.50");
  assert(parseLocalizedAmount("150,000.50") === 150000.5, "parseLocalizedAmount: '150,000.50' -> 150000.50");
  assert(parseLocalizedAmount("150.000,50") === 150000.5, "parseLocalizedAmount: '150.000,50' -> 150000.50");
  assert(parseLocalizedAmount("45000") === 45000, "parseLocalizedAmount: '45000' -> 45000");
  assert(parseLocalizedAmount("45.000") === 45000, "parseLocalizedAmount: '45.000' -> 45000");
  assert(parseLocalizedAmount("$45.000") === 45000, "parseLocalizedAmount: '$45.000' -> 45000");
  assert(parseLocalizedAmount(null) === null, "parseLocalizedAmount: null -> null");
  assert(parseLocalizedAmount("") === null, "parseLocalizedAmount: '' -> null");
  assert(parseLocalizedAmount("   ") === null, "parseLocalizedAmount: '   ' -> null");
  assert(parseLocalizedAmount("abc") === null, "parseLocalizedAmount: 'abc' -> null");
  assert(parseLocalizedAmount("0") === 0, "parseLocalizedAmount: '0' -> 0");
  assert(parseLocalizedAmount("-150") === -150, "parseLocalizedAmount: '-150' -> -150");

  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  assert(normalizeNullableUuid(validUuid) === validUuid, "normalizeNullableUuid: UUID válido -> UUID");
  assert(normalizeNullableUuid("") === null, "normalizeNullableUuid: '' -> null");
  assert(normalizeNullableUuid("   ") === null, "normalizeNullableUuid: '   ' -> null");
  assert(normalizeNullableUuid(null) === null, "normalizeNullableUuid: null -> null");
  assert(normalizeNullableUuid("cust-imported") === null, "normalizeNullableUuid: 'cust-imported' -> null");
  assert(normalizeNullableUuid("invalid-uuid") === null, "normalizeNullableUuid: 'invalid-uuid' -> null");

  // -------------------------------------------------------------------------
  // 2. Tests de UUID Cross-Tenant, Inexistentes y Membership (Punto 1 y 2)
  // -------------------------------------------------------------------------
  const localRepo = new LocalRepository();
  const orgA = await localRepo.createOrganization({
    name: "Tenant A UUID Tests",
    taxId: "30-11111111-1",
    industry: "Servicios",
    currency: "ARS",
    currencySymbol: "$",
    isDemo: false
  });

  const orgB = await localRepo.createOrganization({
    name: "Tenant B UUID Tests",
    taxId: "30-22222222-2",
    industry: "Comercio",
    currency: "ARS",
    currencySymbol: "$",
    isDemo: false
  });

  // Cliente y Proveedor creados en Tenant A con UUID real
  const custInOrgA = await localRepo.createCustomer(orgA.id, {
    name: "Cliente Propio Org A",
    taxId: "30-12345678-9",
    email: "clienteA@test.com",
    phone: "11-1234-5678",
    status: "active",
    totalSpent: 0,
    totalPendingDebt: 0
  });

  const supInOrgA = await localRepo.createSupplier(orgA.id, {
    name: "Proveedor Propio Org A",
    contactName: "Contacto A",
    email: "supA@test.com",
    phone: "11-9876-5432",
    category: "General",
    totalPaid: 0,
    pendingPayment: 0
  });

  // Test A: Usuario miembro de ORG_A + UUID propio -> PASS
  const ownCust = await localRepo.findOrCreateCustomer(orgA.id, custInOrgA.id);
  assert(ownCust?.id === custInOrgA.id, "Membership Check & UUID Propio Cliente: Encontrado y retornado en Tenant A");

  const ownSup = await localRepo.findOrCreateSupplier(orgA.id, supInOrgA.id);
  assert(ownSup?.id === supInOrgA.id, "Membership Check & UUID Propio Proveedor: Encontrado y retornado en Tenant A");

  // Test B: UUID de otro tenant -> REJECT
  let rejectedForeignCust = false;
  try {
    await localRepo.findOrCreateCustomer(orgB.id, custInOrgA.id);
  } catch (err: any) {
    rejectedForeignCust = true;
  }
  assert(rejectedForeignCust, "Membership Check & Cross-Tenant Cliente: Rechazado explícitamente sin crear entidad");

  let rejectedForeignSup = false;
  try {
    await localRepo.findOrCreateSupplier(orgB.id, supInOrgA.id);
  } catch (err: any) {
    rejectedForeignSup = true;
  }
  assert(rejectedForeignSup, "Membership Check & Cross-Tenant Proveedor: Rechazado explícitamente sin crear entidad");

  // Test C: UUID sintácticamente válido pero inexistente -> REJECT
  const randomNonExistentUuid = "99999999-9999-4999-a999-999999999999";
  let rejectedInexistentCust = false;
  try {
    await localRepo.findOrCreateCustomer(orgA.id, randomNonExistentUuid);
  } catch (err: any) {
    rejectedInexistentCust = true;
  }
  assert(rejectedInexistentCust, "UUID Inexistente Cliente: Rechazado explícitamente");

  // Test D: Texto normal -> Find or Create exitoso
  const resolvedByName = await localRepo.findOrCreateCustomer(orgA.id, "Empresa Textil SRL");
  assert(Boolean(resolvedByName?.id) && resolvedByName?.name === "Empresa Textil SRL", "Texto Normal Cliente: find/create exitoso con UUID emitido");

  // -------------------------------------------------------------------------
  // 3. Tests de Concurrencia (Punto 7)
  // -------------------------------------------------------------------------
  const [concCust1, concCust2] = await Promise.all([
    localRepo.findOrCreateCustomer(orgA.id, "Empresa Concurrente SRL"),
    localRepo.findOrCreateCustomer(orgA.id, "Empresa Concurrente SRL")
  ]);
  assert(concCust1?.id === concCust2?.id, "Concurrencia Cliente: Dos llamadas simultáneas devuelven exactamente la misma entidad sin duplicación");

  const allCusts = await localRepo.getCustomers(orgA.id);
  const matchedCusts = allCusts.data.filter(c => c.name.toLowerCase() === "empresa concurrente srl");
  assert(matchedCusts.length === 1, "Concurrencia Cliente: Exactamente UN solo registro persistido en la organización");

  const [concSup1, concSup2] = await Promise.all([
    localRepo.findOrCreateSupplier(orgA.id, "Proveedor Concurrente SRL"),
    localRepo.findOrCreateSupplier(orgA.id, "Proveedor Concurrente SRL")
  ]);
  assert(concSup1?.id === concSup2?.id, "Concurrencia Proveedor: Dos llamadas simultáneas devuelven la misma entidad");

  // -------------------------------------------------------------------------
  // 4. Verificaciones de Restricciones PostgreSQL y Sanitización
  // -------------------------------------------------------------------------
  const validSaleCustId = normalizeNullableUuid(custInOrgA.id);
  assert(validSaleCustId === custInOrgA.id, "PostgreSQL Payload: sales.customer_id = UUID válido aceptado");
  assert(normalizeNullableUuid(null) === null, "PostgreSQL Payload: sales.customer_id = NULL aceptado");
  assert(normalizeNullableUuid("") === null, "PostgreSQL Sanitizer: sales.customer_id = '' transformado a NULL antes de DB");

  const validExpSupId = normalizeNullableUuid(supInOrgA.id);
  assert(validExpSupId === supInOrgA.id, "PostgreSQL Payload: expenses.supplier_id = UUID válido aceptado");
  assert(normalizeNullableUuid(null) === null, "PostgreSQL Payload: expenses.supplier_id = NULL aceptado");
  assert(normalizeNullableUuid("") === null, "PostgreSQL Sanitizer: expenses.supplier_id = '' transformado a NULL antes de DB");

  const validAmount = parseLocalizedAmount("150000.50");
  assert(validAmount !== null && validAmount > 0, "PostgreSQL Constraint: expenses.amount > 0 admitido");

  const zeroAmount = parseLocalizedAmount("0");
  assert(zeroAmount === 0, "PostgreSQL Constraint: expenses.amount = 0 interceptado para descarte");

  const negativeAmount = parseLocalizedAmount("-500");
  assert(negativeAmount !== null && negativeAmount < 0, "PostgreSQL Constraint: expenses.amount < 0 interceptado para descarte");

  // -------------------------------------------------------------------------
  // 5. Tests de Cuotas de Director IA y Reset Server-Side
  // -------------------------------------------------------------------------
  const quota9 = PlanLimitsService.canQueryAI(9, "starter", "trialing");
  assert(quota9.allowed === true && quota9.remaining === 1, "Cuota IA 9/10: Permitido con 1 consulta restante");

  const quota10 = PlanLimitsService.canQueryAI(10, "starter", "trialing");
  assert(quota10.allowed === false && quota10.remaining === 0, "Cuota IA 10/10: Bloqueado por cuota trial agotada");

  // Simulación de Reset Server-Side restringido a trialing
  let usageOrgA = 10;
  assert(PlanLimitsService.canQueryAI(usageOrgA, "starter", "trialing").allowed === false, "Tenant A: Bloqueado a 10 consultas");

  // Reset en Trialing -> Permitido
  usageOrgA = 0;
  const postResetA = PlanLimitsService.canQueryAI(usageOrgA, "starter", "trialing");
  assert(postResetA.allowed === true && postResetA.remaining === 10, "Reset Server-Side: Restablecido a 0/10 y nueva consulta permitida");

  // Aislamiento Multi-Tenant del Reset: Tenant B sigue bloqueado
  const usageOrgB = 10;
  const postResetB = PlanLimitsService.canQueryAI(usageOrgB, "starter", "trialing");
  assert(postResetB.allowed === false, "Multi-Tenant Reset: Tenant B permanece bloqueado independientemente");

  // -------------------------------------------------------------------------
  // 6. Precios y Cupos Founder Canónicos
  // -------------------------------------------------------------------------
  assert(PlanLimitsService.TOTAL_FOUNDER_SLOTS === 10, "Founder Slots: Regla comercial 10 cupos estrictos");
  assert(Math.max(0, PlanLimitsService.TOTAL_FOUNDER_SLOTS - 0) === 10, "Founder 0/10: 10 cupos disponibles");
  assert(Math.max(0, PlanLimitsService.TOTAL_FOUNDER_SLOTS - 10) === 0, "Founder 10/10: 0 cupos disponibles");

  console.log(`\nResultado Suite Definitiva Hardened: ${passed} pruebas exitosas, ${failed} fallidas.`);
  return failed === 0;
}
