import { BusinessInsight } from "./types";

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
  requiresConfirmation: boolean;
}

export interface DirectorRequest {
  organizationId?: string; // Opcional, el server deriva de la sesion
  question: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  contextOptions?: {
    includeDocumentIds?: string[];
    period?: "current_month" | "last_month" | "year_to_date" | "all";
  };
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

export interface DirectorError {
  code:
    | "UNAUTHENTICATED"
    | "UNAUTHORIZED"
    | "RATE_LIMITED"
    | "INVALID_REQUEST"
    | "LLM_UNAVAILABLE"
    | "LLM_TIMEOUT"
    | "INVALID_AI_RESPONSE"
    | "ACTION_REJECTED"
    | "INTERNAL_ERROR";
  message: string;
  details?: any;
}
