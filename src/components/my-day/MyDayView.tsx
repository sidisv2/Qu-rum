import React, { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  Plus,
  ArrowDownRight,
  FileSpreadsheet
} from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { formatCurrency } from "../../lib/utils/formatters";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

interface MyDayViewProps {
  onNavigateToSection: (section: any) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({ onNavigateToSection }) => {
  const {
    tasks,
    receivables,
    quotes,
    recommendations,
    toggleTaskStatus,
    createTask,
    applyAIRecommendation,
    currentOrg
  } = useOrg();

  const { showToast } = useToast();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");

  const overdueReceivables = receivables.filter(r => r.status === "overdue");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const expiringQuotes = quotes.filter(q => q.status === "sent");
  const pendingRecommendations = recommendations.filter(r => r.status === "pending");

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

  const totalActionsCount = overdueReceivables.length + pendingTasks.length + pendingRecommendations.length;

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
            Plan de acción priorizado para hoy en <strong>{currentOrg?.name}</strong>. {totalActionsCount} acciones pendientes.
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
        {overdueReceivables.length > 0 && (
          <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-danger">Prioridad Alta</span>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Cobranzas Vencidas ({overdueReceivables.length})</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToSection("receivables")}
                icon={<ArrowRight size={14} />}
              >
                Ir a Cobros
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {overdueReceivables.map(rec => (
                <div
                  key={rec.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "var(--color-bg-base)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <ArrowDownRight size={16} style={{ color: "var(--color-danger-text)" }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{rec.customerName}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-danger-text)", marginLeft: "0.5rem" }}>
                        Venció hace {rec.overdueDays} días
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-danger-text)" }} className="tabular-nums">
                      {formatCurrency(rec.balance)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToSection("receivables")}
                    >
                      Cobrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRecommendations.length > 0 && (
          <div className="card" style={{ borderLeft: "4px solid var(--color-accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-info">Sugerido por Director IA</span>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Oportunidades y Mitigación ({pendingRecommendations.length})</h3>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pendingRecommendations.map(rec => (
                <div
                  key={rec.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "var(--color-bg-base)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{rec.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{rec.recommendation}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      applyAIRecommendation(rec.id);
                      showToast("Acción convertida en tarea del día");
                    }}
                  >
                    Tomar Acción
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    cursor: "pointer",
                    transition: "all 0.12s ease"
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
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{task.title}</span>
                      {task.suggestedByAi && (
                        <span className="badge badge-info" style={{ marginLeft: "0.5rem", fontSize: "0.6875rem" }}>IA</span>
                      )}
                    </div>
                  </div>
                  <span className={"badge " + (task.priority === "high" ? "badge-danger" : "badge-neutral")}>
                    {task.priority === "high" ? "Alta" : "Normal"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {expiringQuotes.length > 0 && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileSpreadsheet size={16} style={{ color: "var(--color-warning)" }} />
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Presupuestos Abiertos a Cerrar ({expiringQuotes.length})</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToSection("quotes")}
                icon={<ArrowRight size={14} />}
              >
                Ver todos
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {expiringQuotes.slice(0, 3).map(quote => (
                <div
                  key={quote.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "var(--color-bg-base)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-subtle)"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{quote.customerName}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                      ({quote.quoteNumber})
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem" }} className="tabular-nums">
                      {formatCurrency(quote.total)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToSection("quotes")}
                    >
                      Seguimiento
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
