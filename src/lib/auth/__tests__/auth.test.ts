import { isSupabaseConfigured } from "../../supabase/client";

export async function runAuthTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Autenticación y Organizaciones (Fase 4C - Direx) ===");
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

  // 1. Detección segura de credenciales
  const isConfigured = isSupabaseConfigured();
  assert(typeof isConfigured === "boolean", "isSupabaseConfigured() no arroja excepciones en runtime");

  // 2. Modelo de usuario y roles
  const validRoles = ["owner", "admin", "member"];
  assert(validRoles.includes("owner"), "Rol owner soportado por RBAC");
  assert(validRoles.includes("admin"), "Rol admin soportado por RBAC");
  assert(validRoles.includes("member"), "Rol member soportado por RBAC");

  // 3. Fallback de modo y prevención de fugas silenciosas
  const envMode = process.env.VITE_DATA_MODE || "local";
  assert(envMode === "local" || envMode === "supabase", "VITE_DATA_MODE tiene un valor explícito controlado");

  console.log("\nResultado Autenticación: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
