# CONTRATO DE ACCIONES Y COMUNICACIÓN DEL DIRECTOR IA — DIREX

```typescript
export type DirectorActionType = "create_task" | "send_reminder" | "view_entity";

export interface DirectorActionProposal {
  id: string;
  type: DirectorActionType;
  label: string;
  description: string;
  payload: {
    entityType?: "customer" | "supplier" | "sale" | "expense" | "receivable" | "payable" | "task";
    entityId?: string;
    taskTitle?: string;
    taskDescription?: string;
    taskPriority?: "urgent" | "high" | "medium" | "low";
    taskDueDate?: string;
    assignedTo?: string;
    reminderRecipient?: string;
    reminderMessage?: string;
  };
  requiresConfirmation: boolean; // Siempre true para mutaciones
}

export interface DirectorResponse {
  requestId: string;
  organizationId: string;
  type: "answer" | "action_proposal" | "diagnostic";
  answer: string;
  structuredInsights?: BusinessInsight[];
  actions?: DirectorActionProposal[];
  timestamp: string;
}
```
