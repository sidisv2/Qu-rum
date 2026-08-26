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

async function main() {
  const p1 = runValidationSuite();
  const p2 = await runIntelligenceTestSuite();
  const p3 = await runRepositoryTestSuite();
  const p4 = await runAuthTestSuite();
  const p5 = await runMasterModulesTestSuite();
  const p6 = await runFinancialModulesTestSuite();
  const p7 = await runPaymentsTestSuite();
  const p8 = await runTasksDocumentsTestSuite();
  const p9 = await runE2EFullAuditSuite();
  const p10 = await runDirectorSecurityTestSuite();
  const p11 = await runProductionSecurityTestSuite();
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6 || !p7 || !p8 || !p9 || !p10 || !p11) {
    process.exit(1);
  }
}
main();
