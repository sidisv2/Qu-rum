import { runValidationSuite } from "./businessLogic.test";
import { runIntelligenceTestSuite } from "./intelligenceEngine.test";
import { runRepositoryTestSuite } from "./repository.test";
import { runAuthTestSuite } from "../lib/auth/__tests__/auth.test";
import { runMasterModulesTestSuite } from "../lib/master-modules/__tests__/masterModules.test";
import { runFinancialModulesTestSuite } from "../lib/financial/__tests__/financialModules.test";
import { runPaymentsTestSuite } from "../lib/payments/__tests__/paymentsWorkflow.test";
import { runTasksDocumentsTestSuite } from "../lib/tasks-documents/__tests__/tasksDocumentsWorkflow.test";
import { runE2EFullAuditSuite } from "../lib/e2e-audit/__tests__/e2eFullWorkflow.test";
import { runDirectorSecurityTestSuite } from "../lib/intelligence/__tests__/directorSecurity.test";
import { runProductionSecurityTestSuite } from "../lib/security/__tests__/productionSecurity.test";
import { runCsvImportIntegrationSuite } from "./csvImport.integration.test";
import { OrganizationStore } from "../lib/db/orgStore";
import { resetStorageRepository } from "../lib/storage";

function resetTestEnvironment() {
  OrganizationStore.clearStore();
  resetStorageRepository();
}

async function main() {
  resetTestEnvironment();
  const p1 = runValidationSuite();
  resetTestEnvironment();
  const p2 = await runIntelligenceTestSuite();
  resetTestEnvironment();
  const p3 = await runRepositoryTestSuite();
  resetTestEnvironment();
  const p4 = await runAuthTestSuite();
  resetTestEnvironment();
  const p5 = await runMasterModulesTestSuite();
  resetTestEnvironment();
  const p6 = await runFinancialModulesTestSuite();
  resetTestEnvironment();
  const p7 = await runPaymentsTestSuite();
  resetTestEnvironment();
  const p8 = await runTasksDocumentsTestSuite();
  resetTestEnvironment();
  const p9 = await runE2EFullAuditSuite();
  resetTestEnvironment();
  const p10 = await runDirectorSecurityTestSuite();
  resetTestEnvironment();
  const p11 = await runProductionSecurityTestSuite();
  resetTestEnvironment();
  const p12 = await runCsvImportIntegrationSuite();
  resetTestEnvironment();

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6 || !p7 || !p8 || !p9 || !p10 || !p11 || !p12) {
    process.exit(1);
  }
}
main();
