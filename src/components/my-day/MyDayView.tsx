import React, { useState, useMemo } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Plus,
  ArrowRight,
  FileText
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { useToast } from "../ui/Toast";
import { InsightEngine } from "../../lib/intelligence/insightEngine";
import { BusinessInsight } from "../../lib/intelligence/types";

interface MyDayViewProps {
  onNavigateToSection: (section: any) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({ onNavigateToSection }) => {
  const {
    tasks,
    receivables,
    quotes,
    sales,
    expenses,
    customers,
    products,
    toggleTaskStatus,
    createTask,
    currentOrg
  } = useOrg();

  const { showToast } = useToast();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [evidenceInsight, setEvidenceInsight] = useState<BusinessInsight | null>(null);

  // Consumir el Motor Único de Insights
  const analytics = useMemo(() => {
    return InsightEngine.analyze({
      organizationId: currentOrg?.id || "org-1",
      customers,
      products,
      sales,
      expenses,
      receivables,
      payables: [],
      quotes
    });
  }, [currentOrg, customers, products, sales, expenses, receivables, quotes]);

  const { insights } = analytics;
  const pendingTasks = tasks.filter(t => t.status === "pending");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle.trim(),
      description: "Creada desde Mi Día",
      priority: taskPriority,
      dueDate: new Date().toISOString().split("T")[0],
      status: "pending"
    });
    setTaskTitle("");
    setIsNewTaskOpen(false);
    showToast("Tarea añadida a tu día");
  };

  const handleToggleTask = (id: string) => {
    toggleTaskStatus(id);
    showToast("Estado de tarea actualizado");
  };

  const handleTakeAction = (ins: BusinessInsight) => {
    if (ins.suggestedAction.actionType === "send_reminder") {
      onNavigateToSection("receivables");
    } else if (ins.suggestedAction.actionType === "view_quote") {
      onNavigateToSection("quotes");
    } else if (ins.suggestedAction.actionType === "view_customer") {
      onNavigateToSection("customers");
    } else if (ins.suggestedAction.actionType === "view_expense") {
      onNavigateToSection("expenses");
    } else {
      createTask({
        title: ins.suggestedAction.label,
        description: ins.description,
        priority: ins.severity === "critical" ? "high" : "medium",
        dueDate: new Date().toISOString().split("T")[0],
        status: "pending"
      });
      showToast("Acción convertida en tarea del día");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarCheck size={22} style={{ color: "var(--color-accent)" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              Mi Día
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            Prioridades determinísticas para hoy en <strong>{currentOrg?.name}</strong>. ({insights.length} focos de atención detectados).
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsNewTaskOpen(true)}
        >
          Nueva Tarea
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* 1. Prioridades Detectadas por el Motor de Inteligencia */}
        {insights.length > 0 && (
          <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-neutral" style={{ fontWeight: 700 }}>Focos del Día ({insights.length})</span>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Atención y Mitigación Inmediata</h3>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {insights.map(ins => (
                <div
                  key={ins.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    backgroundColor: "var(--color-bg-base)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={"badge " + (ins.severity === "critical" ? "badge-danger" : ins.severity === "high" ? "badge-warning" : "badge-info")}>
                        {ins.severity.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{ins.title}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
                      {ins.description}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => setEvidenceInsight(ins)}
                      style={{ background: "none", border: "none", color: "var(--color-accent)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                    >
                      <FileText size={12} /> Ver datos
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTakeAction(ins)}
                    >
                      {ins.suggestedAction.label}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Tareas Pendientes del Día */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Tareas Pendientes ({pendingTasks.length})</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Hacé click para completar</span>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)" }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-success)", margin: "0 auto 0.5rem" }} />
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>¡Estás al día!</div>
              <div style={{ fontSize: "0.75rem" }}>No tenés tareas pendientes para hoy.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "var(--color-bg-base)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        border: "2px solid var(--color-border-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{task.title}</span>
                  </div>
                  <span className={"badge " + (task.priority === "high" ? "badge-danger" : "badge-neutral")}>
                    {task.priority === "high" ? "Alta" : "Normal"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer de Evidencia */}
      {evidenceInsight && (
        <Drawer
          isOpen={true}
          onClose={() => setEvidenceInsight(null)}
          title={"Evidencia: " + evidenceInsight.title}
          subtitle="Datos reales que respaldan este insight"
          footer={
            <Button variant="primary" size="sm" onClick={() => setEvidenceInsight(null)}>
              Cerrar
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                DESCRIPCIÓN TÉCNICA
              </div>
              <p style={{ fontSize: "0.875rem", marginTop: "0.4rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                {evidenceInsight.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Datos y Métricas Observadas:
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {evidenceInsight.evidence.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border-default)",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{ev.label}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Origen: {ev.source}</div>
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 800 }} className="tabular-nums">
                      {ev.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Modal Nueva Tarea */}
      {isNewTaskOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewTaskOpen(false)}
          title="Nueva Tarea para Hoy"
          subtitle="Añadí un pendiente administrativo a tu jornada"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsNewTaskOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateTask} disabled={!taskTitle.trim()}>
                Guardar Tarea
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                ¿Qué tenés que hacer hoy? *
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="Ej: Llamar a Distribuidora Sur para confirmar entrega"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                Prioridad
              </label>
              <select
                value={taskPriority}
                onChange={e => setTaskPriority(e.target.value as any)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)" }}
              >
                <option value="high">🔴 Alta (Urgente hoy)</option>
                <option value="medium">🟡 Media</option>
                <option value="low">🟢 Baja</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
