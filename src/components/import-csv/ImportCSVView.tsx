import React, { useState } from "react";
import { UploadCloud, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import { useOrg } from "../../context/OrgContext";
import { Button } from "../ui/Button";

export const ImportCSVView: React.FC = () => {
  const { importBulkData } = useOrg();
  const [targetEntity, setTargetEntity] = useState<"customers" | "products" | "suppliers">("customers");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
        if (results.meta.fields) {
          setColumns(results.meta.fields);
        }
      }
    });
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    const count = importBulkData(targetEntity, parsedData);
    setImportResult({ count });
    setParsedData([]);
    setColumns([]);
    setFileName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Importador Universal CSV
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Carga masiva de clientes, productos y proveedores con validación previa de columnas.
        </p>
      </div>

      <div className="card">
        <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)", display: "block", marginBottom: "0.5rem" }}>
          1. ¿Qué tipo de información vas a importar?
        </label>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(["customers", "products", "suppliers"] as const).map(ent => (
            <button
              key={ent}
              onClick={() => { setTargetEntity(ent); setParsedData([]); }}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid",
                borderColor: targetEntity === ent ? "var(--color-primary)" : "var(--color-border-default)",
                backgroundColor: targetEntity === ent ? "var(--color-primary-light)" : "#ffffff",
                color: targetEntity === ent ? "var(--color-primary-text)" : "var(--color-text-secondary)",
                fontWeight: targetEntity === ent ? 700 : 500,
                cursor: "pointer"
              }}
            >
              {ent === "customers" ? "Clientes" : ent === "products" ? "Productos / Catálogo" : "Proveedores"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ border: "2px dashed var(--color-border-default)", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <UploadCloud size={36} style={{ color: "var(--color-primary)", margin: "0 auto 0.75rem" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
          Selecciona o arrastra tu archivo .CSV
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          Formato UTF-8 delimitado por comas o punto y coma.
        </p>

        <label style={{ display: "inline-block", cursor: "pointer", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "0.875rem" }}>
          Explorar Archivo CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>

        {fileName && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: 600 }}>
            Archivo cargado: {fileName} ({parsedData.length} registros)
          </div>
        )}
      </div>

      {parsedData.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Vista previa de datos ({parsedData.length} filas detectadas)
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmImport}
              icon={<CheckCircle size={14} />}
            >
              Confirmar e Importar
            </Button>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "250px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {columns.map(col => (
                    <th key={col} style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {columns.map(col => (
                      <td key={col} style={{ padding: "0.5rem" }}>{row[col] || "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="card" style={{ backgroundColor: "var(--color-success-bg)", borderColor: "var(--color-success-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-success-text)" }}>
            <CheckCircle size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>¡Importación exitosa!</div>
              <div style={{ fontSize: "0.8125rem" }}>Se agregaron {importResult.count} registros correctamente a la base de datos de tu empresa.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
