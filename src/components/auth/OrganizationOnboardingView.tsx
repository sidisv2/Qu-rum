import React, { useState } from "react";
import { Building2, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { Button } from "../ui/Button";

export const OrganizationOnboardingView: React.FC = () => {
  const { createNewOrganization } = useOrg();
  const [orgName, setOrgName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [industry, setIndustry] = useState("Servicios");
  const [currency, setCurrency] = useState("ARS");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await createNewOrganization(orgName.trim(), industry, taxId.trim());
    } catch (err: any) {
      console.error("Error al crear la organización:", err);
      setErrorMsg(err.message || "No se pudo crear la empresa. Por favor, intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "2.25rem", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-primary-light)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", marginBottom: "0.75rem" }}>
            <Building2 size={24} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Configurá tu Empresa
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Para comenzar, creá tu espacio de trabajo en Direx
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
              Nombre comercial de la empresa *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej: Distribuidora Norte S.R.L."
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
              Identificación Fiscal / CUIT (Opcional)
            </label>
            <input
              type="text"
              placeholder="30-71888999-4"
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
                Rubro
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              >
                <option value="Servicios">Servicios</option>
                <option value="Comercio">Comercio / Distribución</option>
                <option value="Industria">Industria / Fabricación</option>
                <option value="Construcción">Construcción</option>
                <option value="Tecnología">Tecnología / Software</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
                Moneda Principal
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              >
                <option value="ARS">ARS ($ - Peso Argentino)</option>
                <option value="USD">USD ($ - Dólar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !orgName.trim()}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
            icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          >
            {isLoading ? "Creando empresa..." : "Comenzar en Direx"}
          </Button>
        </form>

        <div style={{ marginTop: "1.25rem", padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-success-text)" }}>
          <CheckCircle2 size={16} />
          <span>Serás asignado como Propietario (Owner) con permisos de administración completos.</span>
        </div>
      </div>
    </div>
  );
};
