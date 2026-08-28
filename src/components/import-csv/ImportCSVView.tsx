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
  FileSpreadsheet
} from "lucide-react";
import Papa from "papaparse";
import { useOrg } from "../../context/OrgContext";
import { Button } from "../ui/Button";

const isValidUuid = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

type ImportTarget = "sales" | "expenses" | "mixed" | "customers" | "products" | "suppliers";

export const ImportCSVView: React.FC = () => {
  const {
    currentOrg,
    customers,
    suppliers,
    createCustomer,
    createSupplier,
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
    salesCount: number;
    expensesCount: number;
    othersCount: number;
    totalAmount: number;
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

  const parseNumber = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    const clean = String(val).replace(/[^0-9.,-]/g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0 || !currentOrg) return;
    setIsProcessing(true);
    setErrorMessage(null);

    let salesCount = 0;
    let expensesCount = 0;
    let othersCount = 0;
    let totalAmount = 0;

    try {
      if (targetEntity === "sales") {
        for (const row of parsedData) {
          const clientName = row.cliente || row.customer || row.client || row.Cliente_Proveedor || row.contacto || row.nombre || "Cliente General";
          const amount = parseNumber(row.monto || row.total || row.importe || row.subtotal || row.precio || row.Importe || 0);
          const description = row.concepto || row.descripcion || row.detalle || row.producto || row.Concepto || "Venta importada";
          const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];
          const paymentStatus = (String(row.estado || row.status || row.Estado || "").toLowerCase().includes("pend") || String(row.estado || "").toLowerCase().includes("mora"))
            ? "unpaid"
            : "paid";

          // Buscar o crear cliente y capturar UUID real
          let custId: string | undefined = undefined;
          let targetCust = customers.find(c => c.name.toLowerCase() === clientName.toLowerCase());
          if (targetCust && isValidUuid(targetCust.id)) {
            custId = targetCust.id;
          } else if (clientName && clientName !== "Cliente General") {
            try {
              const created = await createCustomer({
                name: clientName,
                taxId: row.cuit || row.CUIT || "",
                email: row.email || row.Email || "",
                phone: row.telefono || row.Telefono || "",
                address: "",
                status: "active",
                totalSpent: 0,
                totalPendingDebt: 0
              });
              if (created && isValidUuid(created.id)) {
                custId = created.id;
              }
            } catch {}
          }

          await createSale({
            customerId: custId || "",
            customerName: clientName,
            saleNumber: "CSV-" + Math.floor(10000 + Math.random() * 90000),
            items: [
              {
                id: "item-" + Date.now() + "-" + Math.random(),
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

          salesCount++;
          totalAmount += amount;
        }
      } else if (targetEntity === "expenses") {
        for (const row of parsedData) {
          const supplierName = row.proveedor || row.supplier || row.empresa || row.Cliente_Proveedor || row.contacto || row.nombre || "Varios";
          const amount = parseNumber(row.monto || row.total || row.importe || row.gasto || row.Importe || 0);
          const description = row.concepto || row.descripcion || row.detalle || row.Concepto || "Gasto operativo";
          const category = row.categoria || row.category || row.rubro || row.Categoria || "General";
          const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];

          // Buscar o crear proveedor y capturar UUID real
          let supId: string | undefined = undefined;
          let targetSup = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
          if (targetSup && isValidUuid(targetSup.id)) {
            supId = targetSup.id;
          } else if (supplierName && supplierName !== "Varios") {
            try {
              const created = await createSupplier({
                name: supplierName,
                contactName: supplierName,
                email: row.email || row.Email || "",
                phone: row.telefono || row.Telefono || "",
                category,
                totalPaid: 0,
                pendingPayment: 0
              });
              if (created && isValidUuid(created.id)) {
                supId = created.id;
              }
            } catch {}
          }

          await createExpense({
            supplierId: supId,
            supplierName,
            category,
            amount,
            date,
            description,
            isAnomaly: false
          });

          expensesCount++;
          totalAmount += amount;
        }
      } else if (targetEntity === "mixed") {
        for (const row of parsedData) {
          const typeStr = String(row.tipo || row.type || row.Tipo || row.movimiento || "").toLowerCase();
          const amount = parseNumber(row.monto || row.total || row.importe || row.Importe || 0);
          const date = row.fecha || row.date || row.Fecha || new Date().toISOString().split("T")[0];
          const description = row.concepto || row.descripcion || row.detalle || row.Concepto || "Movimiento importado";

          if (typeStr.includes("gasto") || typeStr.includes("egreso") || typeStr.includes("compra")) {
            const supplierName = row.contacto || row.proveedor || row.Cliente_Proveedor || row.tercero || "Varios";
            let supId: string | undefined = undefined;
            const targetSup = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
            if (targetSup && isValidUuid(targetSup.id)) {
              supId = targetSup.id;
            }

            await createExpense({
              supplierId: supId,
              supplierName,
              category: row.categoria || row.Categoria || "Operativo",
              amount,
              date,
              description,
              isAnomaly: false
            });
            expensesCount++;
          } else {
            // Asumir venta/ingreso
            const clientName = row.contacto || row.cliente || row.Cliente_Proveedor || row.tercero || "Cliente General";
            let custId: string | undefined = undefined;
            const targetCust = customers.find(c => c.name.toLowerCase() === clientName.toLowerCase());
            if (targetCust && isValidUuid(targetCust.id)) {
              custId = targetCust.id;
            }

            await createSale({
              customerId: custId || "",
              customerName: clientName,
              saleNumber: "MIX-" + Math.floor(10000 + Math.random() * 90000),
              items: [
                {
                  id: "item-" + Date.now() + "-" + Math.random(),
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
              paymentStatus: "paid",
              date
            });
            salesCount++;
          }
          totalAmount += amount;
        }
      } else {
        // Entidades maestras
        othersCount = importBulkData(targetEntity, parsedData);
      }

      await reloadData();

      setImportResult({
        salesCount,
        expensesCount,
        othersCount,
        totalAmount
      });
      setParsedData([]);
      setColumns([]);
      setFileName("");
    } catch (err: any) {
      setErrorMessage("Ocurrió un error al importar registros: " + (err.message || String(err)));
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

      {/* Resultado de Importación Exitosa */}
      {importResult && (
        <div
          className="card"
          style={{
            backgroundColor: "#f0fdf4",
            borderColor: "#bbf7d0",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CheckCircle size={28} style={{ color: "#16a34a" }} />
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534", margin: 0 }}>
                ¡Importación completada con éxito!
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "#15803d", margin: "0.2rem 0 0 0" }}>
                {importResult.salesCount > 0 && `• ${importResult.salesCount} ventas registradas `}
                {importResult.expensesCount > 0 && `• ${importResult.expensesCount} gastos registrados `}
                {importResult.othersCount > 0 && `• ${importResult.othersCount} registros maestros `}
                {importResult.totalAmount > 0 && `por un total consolidado de $${importResult.totalAmount.toLocaleString("es-AR")}.`}
              </p>
            </div>
          </div>

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
