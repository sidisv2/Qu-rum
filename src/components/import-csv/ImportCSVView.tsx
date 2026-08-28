import React, { useState } from "react";
import {
  UploadCloud,
  CheckCircle,
  TrendingUp,
  Receipt,
  Users,
  Package,
  Building2,
  Layers,
  ArrowRight,
  Bot,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import Papa from "papaparse";
import { useOrg } from "../../context/OrgContext";
import { Button } from "../ui/Button";
import { parseLocalizedAmount, normalizeNullableUuid } from "../../lib/utils/formatters";

type ImportTarget = "sales" | "expenses" | "mixed" | "customers" | "products" | "suppliers";

interface ImportError {
  row: number;
  reason: string;
}

export const ImportCSVView: React.FC = () => {
  const {
    currentOrg,
    customers,
    suppliers,
    createCustomer,
    createSupplier,
    findOrCreateCustomer,
    findOrCreateSupplier,
    createSale,
    createExpense,
    reloadData,
    importBulkData
  } = useOrg();

  const [targetEntity, setTargetEntity] = useState<ImportTarget>("sales");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    salesCount: number;
    expensesCount: number;
    othersCount: number;
    totalAmount: number;
    errors: ImportError[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          setErrorMessage("Error al procesar el archivo CSV. Verificá el formato y delimitadores.");
          return;
        }
        setParsedData(results.data);
        if (results.meta.fields) {
          setColumns(results.meta.fields);
        }
      }
    });
  };

  const normalizeEntityName = (name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0 || !currentOrg) return;
    setIsProcessing(true);
    setErrorMessage(null);

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let salesCount = 0;
    let expensesCount = 0;
    let othersCount = 0;
    let totalAmount = 0;
    const errors: ImportError[] = [];

    try {
      if (targetEntity === "sales") {
        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const rowNum = i + 2; // Considerando fila de encabezados

          // Validar monto
          const rawAmount = row.monto || row.total || row.importe || row.subtotal || row.precio || row.Importe || row.Monto || row.Total;
          const parsedAmount = parseLocalizedAmount(rawAmount);

          if (parsedAmount === null) {
            skipped++;
            errors.push({ row: rowNum, reason: "Monto inválido o no numérico: " + (rawAmount || "vacío") });
            continue;
          }

          if (parsedAmount <= 0) {
            skipped++;
            errors.push({ row: rowNum, reason: `Monto menor o igual a cero ($${parsedAmount}). Descartado por regla de negocio.` });
            continue;
          }

          try {
                        // Resolver cliente de forma garantizada en repositorio (Supabase/Local)
            let rawClient = row.cliente || row.customer || row.client || row.Cliente_Proveedor || row.contacto || row.nombre || row.Cliente;
            let custId: string | undefined = undefined;
            let clientName = "Cliente General";

            if (rawClient && typeof rawClient === "string" && rawClient.trim() !== "") {
              clientName = rawClient.trim();
              try {
                const resolved = await findOrCreateCustomer(clientName, {
                  taxId: row.cuit || row.CUIT || "",
                  email: row.email || row.Email || "",
                  phone: row.telefono || row.Telefono || ""
                });
                if (resolved && normalizeNullableUuid(resolved.id)) {
                  custId = resolved.id;
                  clientName = resolved.name;
                }
              } catch (custErr: any) {
                errors.push({ row: rowNum, reason: "Error al resolver cliente " + clientName + ": " + (custErr.message || custErr) });
              }
            }

            const description = row.concepto || row.descripcion || row.detalle || row.producto || row.Concepto || "Venta importada";
            const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];
            const paymentStatus = (String(row.estado || row.status || row.Estado || "").toLowerCase().includes("pend") || String(row.estado || "").toLowerCase().includes("mora"))
              ? "unpaid"
              : "paid";

            await createSale({
              customerId: custId,
              customerName: clientName,
              saleNumber: "CSV-" + Math.floor(10000 + Math.random() * 90000),
              items: [
                {
                  id: "item-" + Date.now() + "-" + Math.random(),
                  productId: "",
                  description,
                  quantity: 1,
                  unitPrice: parsedAmount,
                  subtotal: parsedAmount
                }
              ],
              subtotal: parsedAmount,
              discount: 0,
              tax: 0,
              total: parsedAmount,
              status: "confirmed",
              paymentStatus,
              date
            });

            imported++;
            salesCount++;
            totalAmount += parsedAmount;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, reason: `Error al registrar venta: ${rowErr.message || String(rowErr)}` });
          }
        }
      } else if (targetEntity === "expenses") {
        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const rowNum = i + 2;

          const rawAmount = row.monto || row.total || row.importe || row.gasto || row.Importe || row.Monto || row.Gasto;
          const parsedAmount = parseLocalizedAmount(rawAmount);

          if (parsedAmount === null) {
            skipped++;
            errors.push({ row: rowNum, reason: "Monto inválido o no numérico: " + (rawAmount || "vacío") });
            continue;
          }

          if (parsedAmount <= 0) {
            skipped++;
            errors.push({ row: rowNum, reason: `Importe menor o igual a cero ($${parsedAmount}). Descartado por constraint expenses_amount_check.` });
            continue;
          }

          try {
            let rawSupplier = row.proveedor || row.supplier || row.empresa || row.Cliente_Proveedor || row.contacto || row.nombre || row.Proveedor;
            const maybeUuid = normalizeNullableUuid(rawSupplier);
            let supId: string | undefined = undefined;
            let supplierName = "Varios";

            if (maybeUuid) {
              const existing = suppliers.find(s => s.id === maybeUuid);
              if (existing) {
                supId = existing.id;
                supplierName = existing.name;
              }
            } else if (rawSupplier && typeof rawSupplier === "string" && rawSupplier.trim() !== "" && rawSupplier.trim().toLowerCase() !== "varios") {
              supplierName = rawSupplier.trim();
              const norm = normalizeEntityName(supplierName);
              let existing = suppliers.find(s => normalizeEntityName(s.name) === norm);
              if (existing) {
                supId = existing.id;
              } else {
                try {
                  const created = await createSupplier({
                    name: supplierName,
                    contactName: supplierName,
                    email: row.email || row.Email || "",
                    phone: row.telefono || row.Telefono || "",
                    category: row.categoria || row.category || row.rubro || row.Categoria || "General",
                    totalPaid: 0,
                    pendingPayment: 0
                  });
                  if (created && normalizeNullableUuid(created.id)) {
                    supId = created.id;
                  }
                } catch (supErr: any) {
                  errors.push({ row: rowNum, reason: `No se pudo auto-crear proveedor "${supplierName}": ${supErr.message || supErr}` });
                }
              }
            }

            const description = row.concepto || row.descripcion || row.detalle || row.Concepto || "Gasto operativo";
            const category = row.categoria || row.category || row.rubro || row.Categoria || "General";
            const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];

            await createExpense({
              supplierId: supId,
              supplierName,
              category,
              amount: parsedAmount,
              date,
              description,
              isAnomaly: false
            });

            imported++;
            expensesCount++;
            totalAmount += parsedAmount;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, reason: `Error al registrar gasto: ${rowErr.message || String(rowErr)}` });
          }
        }
      } else if (targetEntity === "mixed") {
        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const rowNum = i + 2;

          const rawAmount = row.monto || row.total || row.importe || row.Importe || row.Monto;
          const parsedAmount = parseLocalizedAmount(rawAmount);

          if (parsedAmount === null || parsedAmount <= 0) {
            skipped++;
            errors.push({ row: rowNum, reason: "Monto nulo, cero o negativo en movimiento mixto." });
            continue;
          }

          try {
            const typeStr = String(row.tipo || row.type || row.Tipo || row.movimiento || "").toLowerCase();
            const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];
            const description = row.concepto || row.descripcion || row.detalle || row.Concepto || "Movimiento importado";

                        if (typeStr.includes("gasto") || typeStr.includes("egreso") || typeStr.includes("compra")) {
              const supplierName = row.contacto || row.proveedor || row.Cliente_Proveedor || row.tercero || row.Proveedor || "Varios";
              let supId: string | undefined = undefined;
              if (supplierName && supplierName.toLowerCase() !== "varios") {
                const resolvedSup = await findOrCreateSupplier(supplierName);
                if (resolvedSup && normalizeNullableUuid(resolvedSup.id)) {
                  supId = resolvedSup.id;
                }
              }

              await createExpense({
                supplierId: supId,
                supplierName,
                category: row.categoria || row.Categoria || "Operativo",
                amount: parsedAmount,
                date,
                description,
                isAnomaly: false
              });
              expensesCount++;
            } else {
              const clientName = row.contacto || row.cliente || row.Cliente_Proveedor || row.tercero || row.Cliente || "Cliente General";
              let custId: string | undefined = undefined;
              if (clientName) {
                const resolvedCust = await findOrCreateCustomer(clientName);
                if (resolvedCust && normalizeNullableUuid(resolvedCust.id)) {
                  custId = resolvedCust.id;
                }
              }

              await createSale({
                customerId: custId,
                customerName: clientName,
                saleNumber: "MIX-" + Math.floor(10000 + Math.random() * 90000),
                items: [
                  {
                    id: "item-" + Date.now() + "-" + Math.random(),
                    productId: "",
                    description,
                    quantity: 1,
                    unitPrice: parsedAmount,
                    subtotal: parsedAmount
                  }
                ],
                subtotal: parsedAmount,
                discount: 0,
                tax: 0,
                total: parsedAmount,
                status: "confirmed",
                paymentStatus: "paid",
                date
              });
              salesCount++;
            }

            imported++;
            totalAmount += parsedAmount;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, reason: `Error en fila de movimiento mixto: ${rowErr.message || String(rowErr)}` });
          }
        }
      } else {
        // Entidades maestras
        othersCount = importBulkData(targetEntity, parsedData);
        imported = othersCount;
      }

      await reloadData();

      setImportResult({
        imported,
        skipped,
        failed,
        salesCount,
        expensesCount,
        othersCount,
        totalAmount,
        errors
      });
      setParsedData([]);
      setColumns([]);
      setFileName("");
    } catch (err: any) {
      setErrorMessage("Ocurrió un error al procesar la importación: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "950px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
          Importador Universal CSV & Excel
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          Subí tu historial masivo de ventas, comprobantes de gastos o bases de clientes para impactar directamente en el panel y en el Director IA.
        </p>
      </div>

      {/* Selector de Tipo de Importación */}
      <div className="card" style={{ padding: "1rem" }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.5rem" }}>
          ¿Qué tipo de datos vas a importar?
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {[
            { id: "sales", label: "Ventas / Facturas", icon: <TrendingUp size={15} /> },
            { id: "expenses", label: "Gastos / Comprobantes", icon: <Receipt size={15} /> },
            { id: "mixed", label: "Movimientos Mixtos", icon: <Layers size={15} /> },
            { id: "customers", label: "Clientes", icon: <Users size={15} /> },
            { id: "products", label: "Catálogo de Productos", icon: <Package size={15} /> },
            { id: "suppliers", label: "Proveedores", icon: <Building2 size={15} /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTargetEntity(t.id as ImportTarget);
                setParsedData([]);
                setImportResult(null);
                setErrorMessage(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.85rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                borderRadius: "var(--radius-md, 8px)",
                border: targetEntity === t.id ? "1.5px solid #4f46e5" : "1px solid var(--color-border-default)",
                backgroundColor: targetEntity === t.id ? "rgba(79, 70, 229, 0.08)" : "var(--color-bg-base)",
                color: targetEntity === t.id ? "#4f46e5" : "var(--color-text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zona de Drop / Carga de Archivo */}
      <div
        className="card"
        style={{
          padding: "2.5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed var(--color-border-default)",
          backgroundColor: "var(--color-bg-base)",
          borderRadius: "var(--radius-lg, 12px)",
          textAlign: "center"
        }}
      >
        <UploadCloud size={44} style={{ color: "#4f46e5", marginBottom: "0.75rem" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--color-text-primary)" }}>
          {fileName ? fileName : "Seleccioná o arrastrá tu archivo CSV"}
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.35rem", maxWidth: "450px" }}>
          Soporta exportaciones de sistemas contables, Excel, bancos, AFIP o plantillas personalizadas.
        </p>

        <label
          style={{
            marginTop: "1.25rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            borderRadius: "var(--radius-md, 8px)",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)"
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Examinar Archivos</span>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="card" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{errorMessage}</span>
        </div>
      )}

      {/* Previsualización de Datos */}
      {parsedData.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                Vista Previa ({parsedData.length} filas detectadas)
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", margin: "0.2rem 0 0 0" }}>
                Verificá las columnas antes de consolidar el impacto en tus finanzas.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleConfirmImport}
              disabled={isProcessing}
              style={{ fontWeight: 700 }}
            >
              {isProcessing ? "Procesando e Impactando..." : `Confirmar Importación (${parsedData.length} registros)`}
            </Button>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "300px", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-muted)", borderBottom: "1px solid var(--color-border-default)" }}>
                  {columns.map((c, i) => (
                    <th key={i} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700 }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {columns.map((c, i) => (
                      <td key={i} style={{ padding: "0.5rem 0.75rem" }}>
                        {String(row[c] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado de Importación con Auditoría Fila por Fila */}
      {importResult && (
        <div
          className="card"
          style={{
            backgroundColor: importResult.failed === 0 ? "#f0fdf4" : "#fffbeb",
            borderColor: importResult.failed === 0 ? "#bbf7d0" : "#fef3c7",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {importResult.failed === 0 ? (
              <CheckCircle size={28} style={{ color: "#16a34a" }} />
            ) : (
              <AlertTriangle size={28} style={{ color: "#d97706" }} />
            )}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: importResult.failed === 0 ? "#166534" : "#92400e", margin: 0 }}>
                Resumen de Importación
              </h3>
              <p style={{ fontSize: "0.8125rem", color: importResult.failed === 0 ? "#15803d" : "#78350f", margin: "0.2rem 0 0 0" }}>
                Importados con éxito: <strong>{importResult.imported}</strong> | Omitidos: <strong>{importResult.skipped}</strong> | Fallidos: <strong>{importResult.failed}</strong>
                {importResult.totalAmount > 0 && ` | Total consolidado: $${importResult.totalAmount.toLocaleString("es-AR")}`}
              </p>
            </div>
          </div>

          {/* Listado detallado de filas omitidas o con advertencias */}
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: "0.5rem", maxHeight: "160px", overflowY: "auto", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.03)", padding: "0.75rem", borderRadius: "var(--radius-sm, 6px)" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-secondary)" }}>Detalle de registros no importados:</div>
              {importResult.errors.map((e, idx) => (
                <div key={idx} style={{ color: "#991b1b", marginBottom: "0.2rem" }}>
                  • <strong>Fila {e.row}:</strong> {e.reason}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/dashboard");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.5rem 0.85rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                backgroundColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "var(--radius-md, 8px)",
                textDecoration: "none"
              }}
            >
              <span>Ver en Panel Principal</span>
              <ArrowRight size={14} />
            </a>

            <a
              href="/inteligencia/director-ia"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, "", "/inteligencia/director-ia");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.5rem 0.85rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                backgroundColor: "rgba(79, 70, 229, 0.12)",
                color: "#4f46e5",
                borderRadius: "var(--radius-md, 8px)",
                textDecoration: "none"
              }}
            >
              <Bot size={14} />
              <span>Auditar con Director IA</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
