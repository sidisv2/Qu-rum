import { LocalRepository } from "../../repository/localRepository";
import { getStorageRepository } from "../../storage";

export async function runTasksDocumentsTestSuite() {
  console.log("=== Ejecutando Suite de Pruebas de Tasks, Documents y Storage (Fase 4D.5 - Direx) ===");
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
  const storage = getStorageRepository();

  const org = await repo.createOrganization({
    name: "Empresa Operativa 4D5",
    taxId: "30-44556677-8",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Servicios",
    isDemo: false
  });

  // 1. Tasks: Creación y recuperación
  const task = await repo.createTask(org.id, {
    title: "Revisar flujo de caja mensual",
    description: "Analizar impacto de pagos a proveedores",
    priority: "high",
    dueDate: "2026-09-15",
    status: "pending",
    assignedTo: "Analista Financiero"
  });
  assert(!!task.id && task.status === "pending", "Task creada con ID y estado pending");

  // 2. Tasks: Toggle status y actualización
  const toggled = await repo.toggleTaskStatus(org.id, task.id);
  assert(toggled.status === "completed", "Task status alternado a completed");

  // 3. Tasks: Paginación y filtros
  const taskList = await repo.getTasks(org.id, { search: "flujo" });
  assert(taskList.total === 1 && taskList.data[0].title.includes("flujo"), "Búsqueda y paginación de Tasks funciona correctamente");

  // 4. Documents & Storage: Upload en storage y metadata
  const dummyFile = new Blob(["Contenido de prueba PDF"], { type: "application/pdf" });
  const docId = "doc-" + Date.now();
  const uploadResult = await storage.uploadDocument({
    organizationId: org.id,
    documentId: docId,
    file: dummyFile,
    fileName: "factura_servicios.pdf",
    contentType: "application/pdf"
  });
  assert(uploadResult.storagePath.includes(org.id) && uploadResult.fileName === "factura_servicios.pdf", "Storage upload genera path seguro aislado por organizationId");

  // 5. Documents Metadata en Repositorio
  const docMeta = await repo.createDocumentMetadata(org.id, {
    name: "Factura de Servicios",
    fileUrl: uploadResult.storagePath,
    category: "invoice",
    docDate: "2026-08-26",
    fileSize: "12 KB"
  });
  assert(docMeta.name === "Factura de Servicios" && docMeta.fileUrl === uploadResult.storagePath, "Metadata de documento creada y vinculada con storage_path");

  // 6. Signed URL generation
  const signedUrl = await storage.getSignedUrl(org.id, uploadResult.storagePath);
  assert(!!signedUrl && signedUrl.length > 0, "Generación de Signed URL para descarga segura");

  // 7. Rechazo de Signed URL Cross-Tenant
  let crossStorageThrew = false;
  try {
    await storage.getSignedUrl("org-ajena-123", uploadResult.storagePath);
  } catch (e) {
    crossStorageThrew = true;
  }
  assert(crossStorageThrew, "Storage rechaza acceso cross-tenant al path de otra organización");

  // 8. Audit Logs: Append-only y consulta
  const logs = await repo.getAuditLogs(org.id);
  assert(logs.total >= 2, "Audit logs registra automáticamente eventos de creación de tareas y documentos");
  assert(logs.data.some(l => l.action === "CREAR_TAREA"), "Log inmutable contiene registro CREAR_TAREA");

  // 9. Aislamiento Cross-Tenant
  const orgB = await repo.createOrganization({
    name: "Empresa B Aislada",
    taxId: "30-99887766-3",
    currency: "ARS",
    currencySymbol: "$",
    industry: "Comercio",
    isDemo: false
  });

  const tasksB = await repo.getTasks(orgB.id);
  const docsB = await repo.getDocuments(orgB.id);
  const logsB = await repo.getAuditLogs(orgB.id);

  assert(tasksB.total === 0, "Aislamiento: Org B no ve tareas de Org A");
  assert(docsB.total === 0, "Aislamiento: Org B no ve documentos de Org A");
  assert(logsB.total === 0, "Aislamiento: Org B no ve audit logs de Org A");

  console.log("\nResultado Tasks & Documents: " + passed + " pruebas exitosas, " + failed + " fallidas.\n");
  return failed === 0;
}
